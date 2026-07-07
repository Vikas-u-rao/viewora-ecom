import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

// POST /api/v1/orders
export async function createOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      addressId,
      shippingName,
      shippingLine1,
      shippingLine2,
      shippingCity,
      shippingState,
      shippingPincode,
      guestEmail,
      guestPhone,
      items, // array of { variantId, quantity }
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'Order items are required');
    }

    const userId = req.userId || null;

    let finalShippingName = shippingName;
    let finalShippingLine1 = shippingLine1;
    let finalShippingLine2 = shippingLine2;
    let finalShippingCity = shippingCity;
    let finalShippingState = shippingState;
    let finalShippingPincode = shippingPincode;
    let finalAddressId = addressId || null;

    if (userId) {
      if (addressId) {
        const address = await prisma.address.findFirst({
          where: { id: addressId, userId },
        });
        if (!address) {
          throw new AppError('NOT_FOUND', 404, 'Selected address not found');
        }
        finalShippingName = address.name;
        finalShippingLine1 = address.line1;
        finalShippingLine2 = address.line2;
        finalShippingCity = address.city;
        finalShippingState = address.state;
        finalShippingPincode = address.pincode;
      } else {
        if (!shippingName || !shippingLine1 || !shippingCity || !shippingState || !shippingPincode) {
          throw new AppError('VALIDATION_ERROR', 400, 'Shipping address details are required');
        }
      }
    } else {
      // Guest Checkout
      if (!guestEmail || !guestPhone) {
        throw new AppError('VALIDATION_ERROR', 400, 'Guest email and phone are required for guest checkout');
      }
      if (!shippingName || !shippingLine1 || !shippingCity || !shippingState || !shippingPincode) {
        throw new AppError('VALIDATION_ERROR', 400, 'Shipping address details are required');
      }
    }

    // Resolve order totals and verify variant stock
    const variantIds = items.map((i: any) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { product: true },
    });

    if (variants.length !== variantIds.length) {
      throw new AppError('NOT_FOUND', 404, 'One or more product variants not found or inactive');
    }

    let subtotal = new Prisma.Decimal(0);
    const itemsToProcess = items.map((item: any) => {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new AppError('NOT_FOUND', 404, `Variant ${item.variantId} not found`);
      }
      if (variant.stock < item.quantity) {
        throw new AppError(
          'OUT_OF_STOCK',
          400,
          `Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}, Requested: ${item.quantity}`
        );
      }
      subtotal = subtotal.add(variant.price.mul(item.quantity));
      return {
        variant,
        quantity: item.quantity,
        priceAtPurchase: variant.price,
      };
    });

    const shippingFee = new Prisma.Decimal(99);
    const finalPayableAmount = subtotal.add(shippingFee); // Coupon logic is v1.1

    // 10-minute expiry for reservations
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const order = await prisma.$transaction(async (tx) => {
      // Decrement stocks & create reservations
      for (const item of itemsToProcess) {
        const updatedVariant = await tx.productVariant.update({
          where: { id: item.variant.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updatedVariant.stock < 0) {
          throw new AppError(
            'OUT_OF_STOCK',
            400,
            `Stock became negative for variant ${item.variant.sku} during concurrent checkout`
          );
        }
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          guestEmail: userId ? null : String(guestEmail).trim().toLowerCase(),
          guestPhone: userId ? null : String(guestPhone).trim(),
          addressId: finalAddressId,
          shippingName: String(finalShippingName).trim(),
          shippingLine1: String(finalShippingLine1).trim(),
          shippingLine2: finalShippingLine2 ? String(finalShippingLine2).trim() : null,
          shippingCity: String(finalShippingCity).trim(),
          shippingState: String(finalShippingState).trim(),
          shippingPincode: String(finalShippingPincode).trim(),
          subtotal,
          discountAmount: new Prisma.Decimal(0),
          shippingFee,
          finalPayableAmount,
          paymentStatus: 'pending',
          fulfillmentStatus: 'unfulfilled',
        },
      });

      // Create OrderItems
      await tx.orderItem.createMany({
        data: itemsToProcess.map((item) => ({
          orderId: newOrder.id,
          variantId: item.variant.id,
          skuSnapshot: item.variant.sku,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
        })),
      });

      // Create StockReservations
      await tx.stockReservation.createMany({
        data: itemsToProcess.map((item) => ({
          variantId: item.variant.id,
          orderId: newOrder.id,
          quantity: item.quantity,
          expiresAt,
          status: 'active',
        })),
      });

      return newOrder;
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/orders
export async function listOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      throw new AppError('UNAUTHENTICATED', 401, 'Authentication required to list orders');
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
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

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/orders/:id
export async function getOrderDetails(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Auth check
    if (order.userId && order.userId !== req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/orders/:id/cancel
export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: 'active' },
        },
      },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Access check
    if (order.userId && order.userId !== req.userId) {
      throw new AppError('FORBIDDEN', 403, 'Access denied to this order');
    }

    if (order.fulfillmentStatus === 'cancelled') {
      throw new AppError('BAD_REQUEST', 400, 'Order is already cancelled');
    }

    if (order.paymentStatus === 'paid') {
      throw new AppError('BAD_REQUEST', 400, 'Cannot cancel a paid order. Please contact support for a refund.');
    }

    // Execute cancellation in transaction
    await prisma.$transaction(async (tx) => {
      // Release any active stock reservations
      for (const reservation of order.reservations) {
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: 'released' },
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

      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          fulfillmentStatus: 'cancelled',
        },
      });
    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  }
}
