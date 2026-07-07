import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { initiatePayment, paymentCallback, getPaymentStatus } from '../controllers/payments';

const router = Router();

const SHIPPING_FEE = 99;

export function calculateCheckoutTotals(subtotal: number, itemCount: number, hasItems: boolean) {
  const effectiveSubtotal = Number(subtotal) || 0;
  const effectiveItemCount = Number(itemCount) || 0;
  const shippingFee = hasItems && effectiveItemCount > 0 ? SHIPPING_FEE : 0;
  const discountAmount = 0;
  const finalPayableAmount = Math.max(0, effectiveSubtotal + shippingFee - discountAmount);

  return {
    subtotal: effectiveSubtotal,
    shippingFee,
    discountAmount,
    finalPayableAmount,
  };
}

router.post('/checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = req.body || {};

    if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
      throw new AppError('VALIDATION_ERROR', 400, 'Card details are required');
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { variant: { include: { product: true } } },
    });

    if (cartItems.length === 0) {
      throw new AppError('EMPTY_CART', 400, 'Your cart is empty');
    }

    const subtotal = cartItems.reduce((sum, item) => {
      const price = Number(item.variant?.price || 0);
      return sum + price * item.quantity;
    }, 0);

    const totals = calculateCheckoutTotals(subtotal, cartItems.length, cartItems.length > 0);

    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        finalPayableAmount: totals.finalPayableAmount,
        paymentStatus: 'paid',
        fulfillmentStatus: 'processing',
      },
    });

    await prisma.orderItem.createMany({
      data: cartItems.map((item) => ({
        orderId: order.id,
        variantId: item.variantId,
        skuSnapshot: item.variant?.sku || 'unknown',
        quantity: item.quantity,
        priceAtPurchase: item.variant?.price || 0,
      })),
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        merchantTransactionId: `VW-${order.id}-${Date.now()}`,
        amount: totals.finalPayableAmount,
        status: 'success',
      },
    });

    await prisma.cartItem.deleteMany({ where: { userId } });

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      orderId: order.id,
      amount: totals.finalPayableAmount,
      cardLast4: String(cardNumber).slice(-4),
    });
  } catch (error) {
    next(error);
  }
});

// PhonePe endpoints
router.post('/initiate', optionalAuth, initiatePayment);
router.post('/callback', paymentCallback);
router.get('/status/:orderId', optionalAuth, getPaymentStatus);

export default router;
