import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail, sendStockConflictAlertEmail } from '../services/email';
import { logger } from '../lib/logger';
import { Prisma } from '@prisma/client';

import { merchantId, saltKey, saltIndex, baseUrl, redirectUrl, callbackUrl } from '../lib/phonepe';
import { getRazorpayClient, razorpayKeyId, razorpayKeySecret } from '../lib/razorpay';


// POST /api/v1/payments/initiate
export async function initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new AppError('VALIDATION_ERROR', 400, 'Order ID is required');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Access control
    if (order.userId) {
      if (order.userId !== req.userId) {
        throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
      }
    } else if (req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to guest order');
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('BAD_REQUEST', 400, 'Order is already paid');
    }

    const merchantTransactionId = `VW-${order.id.slice(0, 8)}-${Date.now()}`;
    const amountInPaise = Math.round(Number(order.finalPayableAmount) * 100);

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: order.userId ? `MUID-${order.userId.slice(0, 8)}` : 'GUEST-USER',
      amount: amountInPaise,
      redirectUrl: `${redirectUrl}?orderId=${order.id}`,
      redirectMode: 'REDIRECT',
      callbackUrl,
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
      .createHash('sha256')
      .update(base64Payload + '/pg/v1/pay' + saltKey)
      .digest('hex') + '###' + saltIndex;

    // Create or update payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        merchantTransactionId,
        amount: order.finalPayableAmount,
        status: 'initiated',
      },
      create: {
        orderId: order.id,
        merchantTransactionId,
        amount: order.finalPayableAmount,
        status: 'initiated',
      },
    });

    // Make PhonePe Standard Pay API call
    logger.info({ msg: 'Initiating PhonePe payment request', orderId: order.id, merchantTransactionId });

    const response = await axios.post(
      `${baseUrl}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': signature,
        },
        timeout: 10000,
      }
    ).catch((error: any) => {
      if (error.code === 'ECONNABORTED') {
        logger.error({ msg: 'PhonePe pay API call timed out', orderId: order.id });
      } else {
        logger.error({ msg: 'PhonePe pay API call failed', error: error.message, orderId: order.id });
      }
      throw error;
    });

    if (response.data && response.data.success) {
      const payUrl = response.data.data.instrumentResponse.redirectInfo.url;
      res.json({ success: true, redirectUrl: payUrl });
    } else {
      throw new AppError(
        'BAD_GATEWAY',
        502,
        'PhonePe initiation failed',
        [{ message: 'Payment gateway initiation failed. Please try again.' }]
      );
    }
  } catch (error: any) {
    logger.error({ msg: 'Payment initiation error', error: error.message, details: error.response?.data });
    next(error);
  }
}

// POST /api/v1/payments/callback
export async function paymentCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { response } = req.body;

    if (!response) {
      throw new AppError('BAD_REQUEST', 400, 'Missing response body');
    }

    const xVerifyHeader = req.headers['x-verify'] as string;
    if (!xVerifyHeader) {
      throw new AppError('BAD_REQUEST', 400, 'Missing X-VERIFY header');
    }

    // Verify callback checksum
    const calculatedSignature = crypto
      .createHash('sha256')
      .update(response + saltKey)
      .digest('hex') + '###' + saltIndex;

    const isChecksumValid = calculatedSignature === xVerifyHeader;

    // Decode response payload
    const decodedPayloadString = Buffer.from(response, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedPayloadString);

    const merchantTransactionId = payload.data?.merchantTransactionId;

    // 1. Audit log callback unconditionally
    const callbackLog = await prisma.paymentCallbackLog.create({
      data: {
        merchantTransactionId: merchantTransactionId || 'UNKNOWN',
        rawPayload: payload,
        checksumValid: isChecksumValid,
        processed: false,
      },
    });

    if (!isChecksumValid) {
      logger.error({ msg: 'Callback checksum validation failed', callbackLogId: callbackLog.id });
      throw new AppError('BAD_REQUEST', 400, 'Invalid checksum signature');
    }

    if (!merchantTransactionId) {
      throw new AppError('BAD_REQUEST', 400, 'Merchant transaction ID not found in payload');
    }

    // Find the corresponding payment record
    const payment = await prisma.payment.findUnique({
      where: { merchantTransactionId },
      include: {
        order: {
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
            reservations: {
              where: { status: 'active' },
            },
          },
        },
      },
    });

    if (!payment) {
      logger.error({ msg: 'Payment record not found for callback', merchantTransactionId });
      // Return 200 to let PhonePe know we received the callback but we don't know this ID
      return res.status(200).json({ success: true, message: 'Transaction not found in our records' });
    }

    // 2. Duplicate Check
    if (payment.status === 'success' || payment.status === 'failed') {
      logger.info({ msg: 'Payment already processed, ignoring duplicate callback', merchantTransactionId });
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    const isSuccess = payload.success && payload.code === 'PAYMENT_SUCCESS';
    const newStatus = isSuccess ? 'success' : 'failed';
    const newPaymentStatus = isSuccess ? 'paid' : 'failed';

    // 3. Process Transaction
    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          gatewayTransactionId: payload.data?.transactionId || null,
          provider: 'phonepe',
        },
      });


      // Update Order Status
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: newPaymentStatus,
        },
      });

      // Stock Reservation handling
      for (const reservation of payment.order.reservations) {
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            status: isSuccess ? 'fulfilled' : 'released',
          },
        });

        // If payment failed, restore stock back
        if (!isSuccess) {
          await tx.productVariant.update({
            where: { id: reservation.variantId },
            data: {
              stock: {
                increment: reservation.quantity,
              },
            },
          });
        }
      }

      // If payment failed, restore reserved coupon back to active
      if (!isSuccess && payment.order.appliedCouponId) {
        await tx.coupon.updateMany({
          where: { id: payment.order.appliedCouponId, status: 'used' },
          data: { status: 'active', usedAt: null },
        });
      }

      // Handle successful payment business rules (Coupon/Referral/etc.)
      if (isSuccess) {
        await applyPostPaymentRewards(tx, payment.order);
      }

      // Mark callback as processed
      await tx.paymentCallbackLog.update({
        where: { id: callbackLog.id },
        data: { processed: true },
      });
    });

    // Send confirmation email asynchronously on success
    if (isSuccess) {
      const customerEmail = payment.order.guestEmail || (await prisma.user.findUnique({
        where: { id: payment.order.userId || '' },
      }))?.email;

      if (customerEmail) {
        sendOrderConfirmationEmail(customerEmail, payment.order).catch((err: any) => {
          logger.error({ msg: 'Background email sending error', err });
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error({ msg: 'Callback processing error', error: error.message });
    next(error);
  }
}

// GET /api/v1/payments/status/:orderId
export async function getPaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Access checks
    if (order.userId) {
      if (order.userId !== req.userId) {
        throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
      }
    } else if (req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to guest order');
    }

    // If order paid/failed, return immediately
    if (order.paymentStatus !== 'pending' && order.payment?.status) {
      return res.json({ paymentStatus: order.paymentStatus, status: order.payment.status });
    }

    // Otherwise double check status with PhonePe
    if (order.payment?.merchantTransactionId) {
      const merchantTransactionId = order.payment.merchantTransactionId;
      const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
      const signature = crypto
        .createHash('sha256')
        .update(path + saltKey)
        .digest('hex') + '###' + saltIndex;

      try {
        const response = await axios.get(`${baseUrl}${path}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': signature,
            'X-MERCHANT-ID': merchantId,
          },
          timeout: 10000,
        }).catch((error: any) => {
          if (error.code === 'ECONNABORTED') {
            logger.error({ msg: 'PhonePe status API call timed out', orderId: order.id });
          } else {
            logger.error({ msg: 'PhonePe status API call failed', error: error.message, orderId: order.id });
          }
          throw error;
        });

        if (response.data && response.data.success) {
          const isSuccess = response.data.code === 'PAYMENT_SUCCESS';
          const newStatus = isSuccess ? 'success' : 'failed';
          const newPaymentStatus = isSuccess ? 'paid' : 'failed';

          // Update DB if different
          if (order.payment.status !== newStatus) {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: order.payment!.id },
                data: {
                  status: newStatus,
                  gatewayTransactionId: response.data.data?.transactionId || null,
                },
              });


              await tx.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: newPaymentStatus,
                },
              });

              // Adjust stock/reservations
              const reservations = await tx.stockReservation.findMany({
                where: { orderId: order.id, status: 'active' },
              });

              for (const res of reservations) {
                await tx.stockReservation.update({
                  where: { id: res.id },
                  data: {
                    status: isSuccess ? 'fulfilled' : 'released',
                  },
                });

                if (!isSuccess) {
                  await tx.productVariant.update({
                    where: { id: res.variantId },
                    data: {
                      stock: { increment: res.quantity },
                    },
                  });
                }
              }

              if (isSuccess) {
                await applyPostPaymentRewards(tx, order);
              } else if (order.appliedCouponId) {
                await tx.coupon.updateMany({
                  where: { id: order.appliedCouponId, status: 'used' },
                  data: { status: 'active', usedAt: null },
                });
              }
            });

            // Send confirmation email asynchronously on success
            if (isSuccess) {
              const customerEmail = order.guestEmail || (await prisma.user.findUnique({
                where: { id: order.userId || '' },
              }))?.email;

              if (customerEmail) {
                const refreshedOrder = await prisma.order.findUnique({
                  where: { id: order.id },
                  include: {
                    items: {
                      include: {
                        variant: {
                          include: { product: true },
                        },
                      },
                    },
                  },
                });
                sendOrderConfirmationEmail(customerEmail, refreshedOrder).catch((err: any) => {
                  logger.error({ msg: 'Background email sending error', err });
                });
              }
            }
          }

          return res.json({ paymentStatus: newPaymentStatus, status: newStatus });
        }
      } catch (err: any) {
        logger.error({ msg: 'Error fetching payment status from PhonePe', err: err.message });
      }
    }

    res.json({ paymentStatus: order.paymentStatus, status: order.payment?.status || 'initiated' });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/payments/razorpay/create-order
export async function createRazorpayOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new AppError('VALIDATION_ERROR', 400, 'Order ID is required');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Access control
    if (order.userId) {
      if (order.userId !== req.userId) {
        throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
      }
    } else if (req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to guest order');
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('BAD_REQUEST', 400, 'Order is already paid');
    }

    // Amount in paise (paise = INR * 100)
    const amountInPaise = Math.round(Number(order.finalPayableAmount) * 100);

    const razorpay = getRazorpayClient();
    const receipt = `vw_rcpt_${order.id.replace(/-/g, '').slice(0, 14)}`;

    logger.info({ msg: 'Creating Razorpay order', orderId: order.id, amountInPaise });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        orderId: order.id,
        userId: order.userId || 'guest',
      },
    });

    // Create or update payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        merchantTransactionId: razorpayOrder.id,
        amount: order.finalPayableAmount,
        status: 'initiated',
        provider: 'razorpay',
      },
      create: {
        orderId: order.id,
        merchantTransactionId: razorpayOrder.id,
        amount: order.finalPayableAmount,
        status: 'initiated',
        provider: 'razorpay',
      },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || razorpayKeyId,
    });
  } catch (error: any) {
    logger.error({ msg: 'Razorpay order creation error', error: error.message, details: error.error || error.response?.data });
    next(error);
  }
}

// POST /api/v1/payments/razorpay/verify
// Shared reward/referral logic (Fix 6)
export async function applyPostPaymentRewards(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    userId: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    subtotal: Prisma.Decimal;
  }
) {
  // A. Generate 10% subtotal coupon if order subtotal >= 5000
  if (order.subtotal.greaterThanOrEqualTo(5000)) {
    const couponValue = order.subtotal.mul(0.10);
    const couponCode = `VW-CPN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    try {
      await tx.coupon.create({
        data: {
          code: couponCode,
          value: couponValue,
          userId: order.userId,
          guestEmail: order.guestEmail,
          guestPhone: order.guestPhone,
          status: 'active',
          expiresAt,
          sourceOrderId: order.id,
        },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        logger.info({ msg: 'Reward coupon already exists for order', orderId: order.id });
      } else {
        throw err;
      }
    }
  }

  // B. Handle referrals for first-time paid users
  if (order.userId) {
    const paidOrdersCount = await tx.order.count({
      where: {
        userId: order.userId,
        paymentStatus: 'paid',
        id: { not: order.id },
      },
    });

    if (paidOrdersCount === 0) {
      const referral = await tx.referral.findFirst({
        where: {
          referredUserId: order.userId,
          status: 'pending',
        },
      });

      if (referral) {
        const referrerCouponCode = `VW-REF-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        const referrerCoupon = await tx.coupon.create({
          data: {
            code: referrerCouponCode,
            value: new Prisma.Decimal(500),
            userId: referral.referrerId,
            status: 'active',
            expiresAt,
          },
        });

        await tx.referral.update({
          where: { id: referral.id },
          data: {
            status: 'qualified',
            generatedCouponId: referrerCoupon.id,
          },
        });
      }
    }
  }
}

// Shared finalization logic for Razorpay transactions (Fix 1)
export async function finalizeRazorpayPayment(
  orderId: string,
  rzpOrderId: string,
  rzpPaymentId: string,
  isSuccess: boolean
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock the order row to prevent concurrency race conditions
    const lockedOrders: any = await tx.$queryRaw`
      SELECT id, payment_status AS "paymentStatus" FROM orders WHERE id = ${orderId} FOR UPDATE
    `;
    const lockedOrder = lockedOrders[0];
    if (!lockedOrder) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Double check status inside transaction
    if (lockedOrder.paymentStatus === 'paid' || lockedOrder.paymentStatus === 'paid_stock_conflict') {
      logger.info({ msg: 'Order already paid, skipping finalization', orderId });
      return { success: true, alreadyProcessed: true, isStockConflict: false, order: null };
    }

    // 2. Fetch full order details
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        reservations: true,
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    const newStatus = isSuccess ? 'success' : 'failed';
    const newPaymentStatus = isSuccess ? 'paid' : 'failed';

    // Update or create Payment record
    await tx.payment.upsert({
      where: { orderId: order.id },
      update: {
        merchantTransactionId: rzpOrderId,
        gatewayTransactionId: rzpPaymentId,
        provider: 'razorpay',
        status: newStatus,
      },
      create: {
        orderId: order.id,
        merchantTransactionId: rzpOrderId,
        gatewayTransactionId: rzpPaymentId,
        provider: 'razorpay',
        amount: order.finalPayableAmount,
        status: newStatus,
      },
    });

    let isStockConflict = false;

    if (isSuccess) {
      // Stock Reservation & Late Payment handling
      const activeReservations = order.reservations.filter((r) => r.status === 'active');
      const hasAllActiveReservations =
        activeReservations.length > 0 && activeReservations.length === order.items.length;

      if (hasAllActiveReservations) {
        // Standard flow: customer completed payment within 10 minutes
        for (const reservation of activeReservations) {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              status: 'fulfilled',
            },
          });
        }
      } else {
        // Late payment edge case: reservation expired & released by cleanup job
        logger.warn({
          msg: 'Late Razorpay payment received after reservation timeout. Verifying current inventory stock.',
          orderId: order.id,
          rzpPaymentId,
        });

        // Re-verify current variant stock availability
        for (const item of order.items) {
          const currentVariant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!currentVariant || currentVariant.stock < item.quantity) {
            isStockConflict = true;
            break;
          }
        }

        if (isStockConflict) {
          logger.error({
            msg: 'CRITICAL: Stock conflict detected on late Razorpay payment. Inventory already claimed by other shoppers.',
            orderId: order.id,
            rzpPaymentId,
          });
        } else {
          // Re-claim inventory stock safely
          for (const item of order.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            await tx.stockReservation.updateMany({
              where: { orderId: order.id, variantId: item.variantId },
              data: { status: 'fulfilled' },
            });
          }
        }
      }

      // Update Order payment status
      if (isStockConflict) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid_stock_conflict',
            fulfillmentStatus: 'cancelled',
          },
        });
      } else {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            fulfillmentStatus: 'unfulfilled',
          },
        });

        // Generate rewards
        await applyPostPaymentRewards(tx, order);
      }
    } else {
      // Payment failed
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'failed',
          fulfillmentStatus: 'cancelled',
        },
      });

      // Stock Reservation handling for failure
      for (const reservation of order.reservations) {
        if (reservation.status === 'active') {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              status: 'released',
            },
          });

          await tx.productVariant.update({
            where: { id: reservation.variantId },
            data: {
              stock: {
                increment: reservation.quantity,
              },
            },
          });
        }
      }

      // Restore reserved coupon back to active
      if (order.appliedCouponId) {
        await tx.coupon.updateMany({
          where: { id: order.appliedCouponId, status: 'used' },
          data: { status: 'active', usedAt: null },
        });
      }
    }

    return { success: true, alreadyProcessed: false, isStockConflict, order };
  });
}

// POST /api/v1/payments/razorpay/verify
export async function verifyRazorpayPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const rzpOrderId = razorpay_order_id || razorpayOrderId;
    const rzpPaymentId = razorpay_payment_id || razorpayPaymentId;
    const rzpSignature = razorpay_signature || razorpaySignature;

    if (!orderId || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Missing required payment verification details (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature)'
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Access control check
    if (order.userId) {
      if (order.userId !== req.userId) {
        throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
      }
    } else if (req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to guest order');
    }

    // Duplicate/Idempotency check
    if (order.paymentStatus === 'paid' && order.payment?.status === 'success') {
      logger.info({ msg: 'Payment already processed successfully', orderId: order.id, rzpPaymentId });
      return res.status(200).json({ success: true, message: 'Payment already processed', orderId: order.id });
    }

    // Compute expected HMAC-SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET || razorpayKeySecret;
    if (!secret) {
      throw new AppError('INTERNAL_ERROR', 500, 'Razorpay secret key not configured');
    }

    const payload = `${rzpOrderId}|${rzpPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(String(rzpSignature), 'utf8');

    // Constant-time signature comparison to prevent timing attacks
    const isSignatureValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    // Audit log callback / verification attempt unconditionally
    const callbackLog = await prisma.paymentCallbackLog.create({
      data: {
        merchantTransactionId: rzpOrderId,
        rawPayload: {
          provider: 'razorpay',
          orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: rzpSignature,
        },
        checksumValid: isSignatureValid,
        processed: false,
      },
    });

    if (!isSignatureValid) {
      logger.error({
        msg: 'Razorpay signature verification failed (tampered or invalid)',
        orderId: order.id,
        rzpOrderId,
        rzpPaymentId,
        callbackLogId: callbackLog.id,
      });
      throw new AppError('BAD_REQUEST', 400, 'Invalid payment signature');
    }

    const result = await finalizeRazorpayPayment(order.id, rzpOrderId, rzpPaymentId, true);

    // Mark callback log as processed
    await prisma.paymentCallbackLog.update({
      where: { id: callbackLog.id },
      data: { processed: true },
    });

    if (result.alreadyProcessed) {
      return res.status(200).json({ success: true, message: 'Payment already processed', orderId: order.id });
    }

    // Send confirmation email asynchronously on success (if no stock conflict)
    if (!result.isStockConflict && result.order) {
      const customerEmail = result.order.guestEmail || (await prisma.user.findUnique({
        where: { id: result.order.userId || '' },
      }))?.email;

      if (customerEmail) {
        sendOrderConfirmationEmail(customerEmail, result.order).catch((err: any) => {
          logger.error({ msg: 'Background email sending error (Razorpay)', err });
        });
      }
    }

    if (result.isStockConflict && result.order) {
      // Fire internal alert for late payment stock conflict (Fix 3)
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@viewora.in';
      const customerEmail = result.order.guestEmail || (result.order.userId ? (await prisma.user.findUnique({
        where: { id: result.order.userId },
      }))?.email : null);
      const contactInfo = result.order.userId
        ? `Registered User: ${result.order.userId} (Email: ${customerEmail || 'unknown'})`
        : `Guest User (Email: ${result.order.guestEmail || 'unknown'}, Phone: ${result.order.guestPhone || 'unknown'})`;

      sendStockConflictAlertEmail(adminEmail, result.order.id, Number(result.order.finalPayableAmount), contactInfo).catch((err: any) => {
        logger.error({ msg: 'Failed to send admin stock conflict alert email', err, orderId: result.order!.id });
      });

      return res.status(200).json({
        success: true,
        warning: 'STOCK_CONFLICT',
        message: 'Payment received but inventory was released due to checkout timeout. Support team will contact you for resolution/refund.',
        orderId: order.id,
      });
    }

    logger.info({ msg: 'Razorpay payment verified and order marked paid', orderId: order.id, rzpPaymentId });
    res.status(200).json({ success: true, message: 'Payment verified successfully', orderId: order.id });
  } catch (error: any) {
    logger.error({ msg: 'Razorpay payment verification error', error: error.message });
    next(error);
  }
}

// POST /api/v1/payments/razorpay/webhook (Fix 1)
export async function razorpayWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const receivedSignature = req.headers['x-razorpay-signature'] as string;
    if (!receivedSignature) {
      throw new AppError('BAD_REQUEST', 400, 'Missing X-Razorpay-Signature header');
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new AppError('INTERNAL_ERROR', 500, 'Razorpay webhook secret not configured');
    }

    // Verify raw body signature
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      throw new AppError('INTERNAL_ERROR', 500, 'Request body is not a raw buffer');
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    const isSignatureValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    // Parse payload
    const bodyString = rawBody.toString('utf8');
    const event = JSON.parse(bodyString);

    const rzpOrderId = event.payload?.payment?.entity?.order_id;
    const rzpPaymentId = event.payload?.payment?.entity?.id;

    // Audit log webhook unconditionally
    const callbackLog = await prisma.paymentCallbackLog.create({
      data: {
        merchantTransactionId: rzpOrderId || 'UNKNOWN',
        rawPayload: event,
        checksumValid: isSignatureValid,
        processed: false,
      },
    });

    if (!isSignatureValid) {
      logger.error({
        msg: 'Razorpay webhook signature verification failed',
        rzpOrderId,
        rzpPaymentId,
        callbackLogId: callbackLog.id,
      });
      throw new AppError('BAD_REQUEST', 400, 'Invalid payment signature');
    }

    // We only process payment.captured (success) and payment.failed (failed) events
    if (event.event !== 'payment.captured' && event.event !== 'payment.failed') {
      logger.info({ msg: `Ignoring unhandled Razorpay webhook event: ${event.event}`, rzpOrderId });
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    if (!rzpOrderId) {
      throw new AppError('BAD_REQUEST', 400, 'Razorpay Order ID not found in payload');
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantTransactionId: rzpOrderId },
    });

    if (!payment) {
      logger.error({ msg: 'Payment record not found for Razorpay webhook', rzpOrderId });
      return res.status(200).json({ success: true, message: 'Transaction not found in our records' });
    }

    const isSuccess = event.event === 'payment.captured';
    const result = await finalizeRazorpayPayment(payment.orderId, rzpOrderId, rzpPaymentId, isSuccess);

    // Mark callback log as processed
    await prisma.paymentCallbackLog.update({
      where: { id: callbackLog.id },
      data: { processed: true },
    });

    if (result.alreadyProcessed) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Send confirmation email asynchronously on success (if no stock conflict)
    if (isSuccess && !result.isStockConflict && result.order) {
      const customerEmail = result.order.guestEmail || (await prisma.user.findUnique({
        where: { id: result.order.userId || '' },
      }))?.email;

      if (customerEmail) {
        sendOrderConfirmationEmail(customerEmail, result.order).catch((err: any) => {
          logger.error({ msg: 'Background email sending error (Razorpay Webhook)', err });
        });
      }
    }

    if (isSuccess && result.isStockConflict && result.order) {
      // Fire internal alert for late payment stock conflict (Fix 3)
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@viewora.in';
      const customerEmail = result.order.guestEmail || (result.order.userId ? (await prisma.user.findUnique({
        where: { id: result.order.userId },
      }))?.email : null);
      const contactInfo = result.order.userId
        ? `Registered User: ${result.order.userId} (Email: ${customerEmail || 'unknown'})`
        : `Guest User (Email: ${result.order.guestEmail || 'unknown'}, Phone: ${result.order.guestPhone || 'unknown'})`;

      sendStockConflictAlertEmail(adminEmail, result.order.id, Number(result.order.finalPayableAmount), contactInfo).catch((err: any) => {
        logger.error({ msg: 'Failed to send admin stock conflict alert email via webhook', err, orderId: result.order!.id });
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error({ msg: 'Razorpay webhook processing error', error: error.message });
    next(error);
  }
}


