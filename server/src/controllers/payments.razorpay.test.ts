import crypto from 'crypto';
import { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhookHandler } from './payments';
import { cleanupExpiredStockReservations } from '../jobs/stockReservationCleanup';
import { prisma } from '../lib/prisma';
import * as razorpayLib from '../lib/razorpay';
import { Prisma } from '@prisma/client';

jest.mock('../lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    paymentCallbackLog: {
      create: jest.fn(),
      update: jest.fn(),
    },
    stockReservation: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    coupon: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
    $queryRaw: jest.fn().mockImplementation(async () => {
      const mockOrder = await (prisma.order.findUnique as jest.Mock)();
      if (mockOrder) {
        return [{ id: mockOrder.id, paymentStatus: mockOrder.paymentStatus }];
      }
      return [];
    }),
  },
}));

jest.mock('../services/email', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(true),
  sendStockConflictAlertEmail: jest.fn().mockResolvedValue(true),
}));

describe('Razorpay Payment Controller', () => {
  const testKeySecret = 'test_secret_key_12345';
  const testKeyId = 'rzp_test_12345';

  beforeAll(() => {
    process.env.RAZORPAY_KEY_ID = testKeyId;
    process.env.RAZORPAY_KEY_SECRET = testKeySecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRazorpayOrder', () => {
    it('creates a Razorpay order with amount converted to paise and upserts payment record with provider', async () => {
      const mockOrder = {
        id: 'ord-test-12345678',
        userId: 'usr-123',
        paymentStatus: 'pending',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'order_rzp_99999',
        amount: 129900,
        currency: 'INR',
      });

      jest.spyOn(razorpayLib, 'getRazorpayClient').mockReturnValue({
        orders: {
          create: mockCreate,
        },
      } as any);

      const req: any = {
        userId: 'usr-123',
        body: { orderId: 'ord-test-12345678' },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await createRazorpayOrder(req, res, next);

      expect(mockCreate).toHaveBeenCalledWith({
        amount: 129900,
        currency: 'INR',
        receipt: expect.stringMatching(/^vw_rcpt_/),
        notes: {
          orderId: 'ord-test-12345678',
          userId: 'usr-123',
        },
      });

      expect(prisma.payment.upsert).toHaveBeenCalledWith({
        where: { orderId: 'ord-test-12345678' },
        update: {
          merchantTransactionId: 'order_rzp_99999',
          amount: mockOrder.finalPayableAmount,
          status: 'initiated',
          provider: 'razorpay',
        },
        create: {
          orderId: 'ord-test-12345678',
          merchantTransactionId: 'order_rzp_99999',
          amount: mockOrder.finalPayableAmount,
          status: 'initiated',
          provider: 'razorpay',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          orderId: 'ord-test-12345678',
          razorpayOrderId: 'order_rzp_99999',
          amount: 129900,
        })
      );
    });

    it('rejects order creation if order not found', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const req: any = {
        userId: 'usr-123',
        body: { orderId: 'non-existent-order' },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await createRazorpayOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Order not found',
        })
      );
    });
  });

  describe('verifyRazorpayPayment', () => {
    const orderId = 'ord-verify-001';
    const razorpayOrderId = 'order_DA28Fq05k2Nl01';
    const razorpayPaymentId = 'pay_29QQoUBi66xm2f';

    const validSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    it('successfully verifies a valid HMAC-SHA256 signature and marks order paid with gatewayTransactionId', async () => {
      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'pending',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
        subtotal: new Prisma.Decimal('1200.00'),
        guestEmail: null,
        guestPhone: null,
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'active' }],
        payment: { status: 'initiated' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'customer@viewora.in' });
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      // Verify audit log created with checksumValid = true
      expect(prisma.paymentCallbackLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            merchantTransactionId: razorpayOrderId,
            checksumValid: true,
          }),
        })
      );

      // Verify payment record updated with gatewayTransactionId and provider: 'razorpay'
      expect(prisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId },
          update: expect.objectContaining({
            merchantTransactionId: razorpayOrderId,
            gatewayTransactionId: razorpayPaymentId,
            provider: 'razorpay',
            status: 'success',
          }),
        })
      );

      // Verify order payment status updated to paid
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { paymentStatus: 'paid', fulfillmentStatus: 'unfulfilled' },
      });

      // Verify reservations fulfilled
      expect(prisma.stockReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'fulfilled' },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment verified successfully',
          orderId,
        })
      );
    });

    it('rejects a tampered or invalid signature and does not update order status', async () => {
      const tamperedSignature = validSignature.slice(0, -4) + 'abcd';

      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'pending',
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'active' }],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-2' });

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: tamperedSignature,
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      // Audit log should record checksumValid = false
      expect(prisma.paymentCallbackLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checksumValid: false,
          }),
        })
      );

      // Order must NOT be updated
      expect(prisma.order.update).not.toHaveBeenCalled();

      // Error passed to next
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid payment signature',
        })
      );
    });

    it('verifies transactional data-level rollback when a write fails partway through', async () => {
      // Create a transactional state store to verify atomic rollback at data-level
      const dbState = {
        order: { id: orderId, paymentStatus: 'pending', fulfillmentStatus: 'unfulfilled' },
        payment: { status: 'initiated', gatewayTransactionId: null as string | null },
        stockReservation: { id: 'res-1', status: 'active' },
        coupons: [] as any[],
      };

      // Mock $transaction to simulate real rollback semantics: if callback throws, state mutations are discarded
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const stateSnapshot = JSON.parse(JSON.stringify(dbState));
        const txClient: any = {
          payment: {
            upsert: jest.fn().mockImplementation(() => {
              dbState.payment.status = 'success';
              dbState.payment.gatewayTransactionId = razorpayPaymentId;
            }),
          },
          order: {
            update: jest.fn().mockImplementation((args) => {
              Object.assign(dbState.order, args.data);
            }),
            findUnique: jest.fn().mockResolvedValue({
              id: orderId,
              userId: 'usr-123',
              paymentStatus: 'pending',
              finalPayableAmount: new Prisma.Decimal('1299.00'),
              subtotal: new Prisma.Decimal('1200.00'),
              guestEmail: null,
              guestPhone: null,
              items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
              reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'active' }],
              payment: { status: 'initiated' },
            }),
          },
          stockReservation: {
            update: jest.fn().mockImplementation(() => {
              // Forced mid-transaction failure (e.g. database error or deadlock)
              throw new Error('Database write collision on stock_reservations table');
            }),
          },
          coupon: {
            create: jest.fn().mockImplementation((args) => {
              dbState.coupons.push(args.data);
            }),
          },
          paymentCallbackLog: {
            update: jest.fn(),
          },
          $queryRaw: jest.fn().mockResolvedValue([{ id: orderId, paymentStatus: 'pending' }]),
        };

        try {
          return await callback(txClient);
        } catch (err) {
          // Revert state snapshot on transaction rollback
          Object.assign(dbState.order, stateSnapshot.order);
          Object.assign(dbState.payment, stateSnapshot.payment);
          Object.assign(dbState.stockReservation, stateSnapshot.stockReservation);
          dbState.coupons = stateSnapshot.coupons;
          throw err;
        }
      });

      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'pending',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
        subtotal: new Prisma.Decimal('1200.00'),
        guestEmail: null,
        guestPhone: null,
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'active' }],
        payment: { status: 'initiated' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-rollback' });

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      // Verify error was caught and sent to Express error handler
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Database write collision on stock_reservations table' })
      );
      expect(res.status).not.toHaveBeenCalledWith(200);

      // Verify DATA-LEVEL ATOMICITY: state was rolled back completely
      expect(dbState.order.paymentStatus).toBe('pending');
      expect(dbState.payment.status).toBe('initiated');
      expect(dbState.stockReservation.status).toBe('active');
      expect(dbState.coupons).toHaveLength(0);
    });

    it('handles late payment after reservation expiry when stock is still available', async () => {
      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'failed',
        fulfillmentStatus: 'cancelled',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
        subtotal: new Prisma.Decimal('1200.00'),
        guestEmail: 'user@viewora.in',
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'released' }], // already released
        payment: { status: 'failed' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-late' });
      // Current variant stock in DB has 5 available
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({ id: 'var-1', stock: 5 });
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      // Re-claimed stock
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { decrement: 1 } },
      });

      // Marked order paid & unfulfilled
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { paymentStatus: 'paid', fulfillmentStatus: 'unfulfilled' },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment verified successfully',
        })
      );
    });

    it('safeguards against oversell when late payment arrives but stock is no longer available', async () => {
      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'failed',
        fulfillmentStatus: 'cancelled',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
        subtotal: new Prisma.Decimal('1200.00'),
        guestEmail: 'user@viewora.in',
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 2 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 2, status: 'released' }], // already released
        payment: { status: 'failed' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-conflict' });
      // Current variant stock in DB is 0 (sold out to another shopper during delay)
      (prisma.productVariant.findUnique as jest.Mock).mockResolvedValue({ id: 'var-1', stock: 0 });

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      // Payment is marked success because money was captured
      expect(prisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId },
          update: expect.objectContaining({ status: 'success' }),
        })
      );

      // Order is flagged as paid_stock_conflict and cancelled to prevent overselling
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { paymentStatus: 'paid_stock_conflict', fulfillmentStatus: 'cancelled' },
      });

      // No stock decrement occurred
      expect(prisma.productVariant.update).not.toHaveBeenCalled();

      // Return warning with stock conflict message for support resolution
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          warning: 'STOCK_CONFLICT',
        })
      );
    });

    it('handles duplicate / already-paid order idempotently', async () => {
      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'paid',
        payment: { status: 'success' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const req: any = {
        userId: 'usr-123',
        body: {
          orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: validSignature,
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await verifyRazorpayPayment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment already processed',
        })
      );
    });
  });

  describe('Abandoned payment and reservation cleanup', () => {
    it('releases expired stock reservations, restores stock, and cancels abandoned orders/payments', async () => {
      const expiredReservation = {
        id: 'res-expired-1',
        orderId: 'ord-abandoned-1',
        variantId: 'var-1',
        quantity: 2,
        status: 'active',
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      };

      (prisma.stockReservation.findMany as jest.Mock).mockResolvedValue([expiredReservation]);
      (prisma.stockReservation.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.productVariant.update as jest.Mock).mockResolvedValue({});
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'ord-abandoned-1',
        paymentStatus: 'pending',
        appliedCouponId: 'coupon-1',
      });
      (prisma.coupon.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.order.update as jest.Mock).mockResolvedValue({});
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await cleanupExpiredStockReservations();

      expect(result).toEqual({ releasedCount: 1 });

      // 1. Stock reservation released
      expect(prisma.stockReservation.updateMany).toHaveBeenCalledWith({
        where: { id: 'res-expired-1', status: 'active' },
        data: { status: 'released' },
      });

      // 2. Product variant stock incremented back
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { increment: 2 } },
      });

      // 3. Coupon restored to active
      expect(prisma.coupon.updateMany).toHaveBeenCalledWith({
        where: { id: 'coupon-1', status: 'used' },
        data: { status: 'active', usedAt: null },
      });

      // 4. Abandoned order marked failed / cancelled
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-abandoned-1' },
        data: {
          paymentStatus: 'failed',
          fulfillmentStatus: 'cancelled',
        },
      });

      // 5. Abandoned initiated payment record marked failed
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { orderId: 'ord-abandoned-1', status: 'initiated' },
        data: { status: 'failed' },
      });
    });
  });

  describe('razorpayWebhookHandler', () => {
    const webhookSecret = 'test_webhook_secret_98765';
    const orderId = 'ord-webhook-001';
    const razorpayOrderId = 'order_webhook_rzp_001';
    const razorpayPaymentId = 'pay_webhook_rzp_001';

    beforeAll(() => {
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    });

    afterAll(() => {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    });

    it('verifies valid signature and processes payment.captured to mark order paid', async () => {
      const eventPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
              amount: 129900,
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(eventPayload), 'utf8');
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'pending',
        finalPayableAmount: new Prisma.Decimal('1299.00'),
        subtotal: new Prisma.Decimal('1200.00'),
        guestEmail: null,
        guestPhone: null,
        items: [{ id: 'item-1', variantId: 'var-1', quantity: 1 }],
        reservations: [{ id: 'res-1', variantId: 'var-1', quantity: 1, status: 'active' }],
        payment: { status: 'initiated' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'pmt-1',
        orderId,
        merchantTransactionId: razorpayOrderId,
      });
      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-webhook-1' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: 'customer@viewora.in' });
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const req: any = {
        headers: { 'x-razorpay-signature': validSignature },
        body: rawBody,
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await razorpayWebhookHandler(req, res, next);

      // Webhook verified signature and logged
      expect(prisma.paymentCallbackLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checksumValid: true,
          }),
        })
      );

      // Order updated to paid
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { paymentStatus: 'paid', fulfillmentStatus: 'unfulfilled' },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it('rejects invalid signature with 400 and does not write to DB beyond callback log', async () => {
      const eventPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(eventPayload), 'utf8');
      const invalidSignature = 'invalid_signature_abcd';

      (prisma.paymentCallbackLog.create as jest.Mock).mockResolvedValue({ id: 'log-webhook-2' });

      const req: any = {
        headers: { 'x-razorpay-signature': invalidSignature },
        body: rawBody,
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await razorpayWebhookHandler(req, res, next);

      // Should log with checksumValid: false
      expect(prisma.paymentCallbackLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            checksumValid: false,
          }),
        })
      );

      // Order should NOT be updated
      expect(prisma.order.update).not.toHaveBeenCalled();

      // Error passed to next
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid payment signature',
        })
      );
    });

    it('handles webhook idempotently and returns 200 without duplicate action if order already paid', async () => {
      const eventPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: razorpayPaymentId,
              order_id: razorpayOrderId,
            },
          },
        },
      };

      const rawBody = Buffer.from(JSON.stringify(eventPayload), 'utf8');
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const mockOrder = {
        id: orderId,
        userId: 'usr-123',
        paymentStatus: 'paid', // already paid!
        payment: { status: 'success' },
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'pmt-1',
        orderId,
        merchantTransactionId: razorpayOrderId,
      });

      const req: any = {
        headers: { 'x-razorpay-signature': validSignature },
        body: rawBody,
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await razorpayWebhookHandler(req, res, next);

      // Returns 200 already processed
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Already processed' })
      );

      // Order finalization not called again
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
