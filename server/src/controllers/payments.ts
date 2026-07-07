import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../services/email';
import { logger } from '../lib/logger';

// Load credentials
const merchantId = process.env.PHONEPE_MERCHANT_ID === 'YOUR_VALUE_HERE' || !process.env.PHONEPE_MERCHANT_ID ? 'PGOMT' : process.env.PHONEPE_MERCHANT_ID;
const saltKey = process.env.PHONEPE_SALT_KEY === 'YOUR_VALUE_HERE' || !process.env.PHONEPE_SALT_KEY ? '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399' : process.env.PHONEPE_SALT_KEY;
const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
const phonepeEnv = process.env.PHONEPE_ENV || 'sandbox';

const baseUrl = phonepeEnv === 'production'
  ? (process.env.PHONEPE_BASE_URL_PRODUCTION || 'https://api.phonepe.com/apis/hermes')
  : (process.env.PHONEPE_BASE_URL_SANDBOX || 'https://api-preprod.phonepe.com/apis/pg-sandbox');

const redirectUrl = process.env.PHONEPE_REDIRECT_URL || 'http://localhost:3000/payment/status';
const callbackUrl = process.env.PHONEPE_CALLBACK_URL || 'http://localhost:5000/api/v1/payments/callback';

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
    if (order.userId && order.userId !== req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
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
      }
    );

    if (response.data && response.data.success) {
      const payUrl = response.data.data.instrumentResponse.redirectInfo.url;
      res.json({ success: true, redirectUrl: payUrl });
    } else {
      throw new AppError('BAD_GATEWAY', 502, 'PhonePe initiation failed', response.data);
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
          phonepeTransactionId: payload.data?.transactionId || null,
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
    if (order.userId && order.userId !== req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
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
                  phonepeTransactionId: response.data.data?.transactionId || null,
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
