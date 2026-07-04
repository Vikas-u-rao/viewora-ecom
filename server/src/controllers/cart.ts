import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';

// Helper to check if a product variant is active and available
function isAvailable(item: any): boolean {
  if (!item.variant || !item.variant.isActive) return false;
  if (!item.variant.product || !item.variant.product.isActive || item.variant.product.deletedAt !== null) return false;
  return true;
}

export async function getCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    // Format output and flag unavailable items
    const formattedItems = cartItems.map((item) => {
      const available = isAvailable(item);
      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        productUnavailable: !available,
        variant: item.variant ? {
          id: item.variant.id,
          sku: item.variant.sku,
          color: item.variant.color,
          size: item.variant.size,
          lensType: item.variant.lensType,
          material: item.variant.material,
          price: item.variant.price,
          stock: item.variant.stock,
          imageUrls: item.variant.imageUrls.length > 0 ? item.variant.imageUrls : item.variant.product.defaultImageUrls,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            brand: item.variant.product.brand,
          }
        } : null,
      };
    });

    res.status(200).json(formattedItems);
  } catch (error) {
    next(error);
  }
}

export async function addToCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { variantId, quantity = 1 } = req.body;

    if (!variantId) {
      throw new AppError('VALIDATION_ERROR', 400, 'variantId is required');
    }

    // Verify variant exists and is active
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, isActive: true },
      include: { product: true },
    });

    if (!variant || !variant.product || !variant.product.isActive || variant.product.deletedAt !== null) {
      throw new AppError('VARIANT_UNAVAILABLE', 422, 'Product or variant is no longer available');
    }

    if (variant.stock < quantity) {
      throw new AppError('OUT_OF_STOCK', 422, `Only ${variant.stock} units left in stock`);
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_variantId: { userId, variantId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId,
        variantId,
        quantity,
      },
    });

    res.status(200).json(cartItem);
  } catch (error) {
    next(error);
  }
}

export async function updateCartItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      throw new AppError('VALIDATION_ERROR', 400, 'Quantity must be at least 1');
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
      include: { variant: true },
    });

    if (!cartItem) {
      throw new AppError('NOT_FOUND', 404, 'Cart item not found');
    }

    if (cartItem.variant.stock < quantity) {
      throw new AppError('OUT_OF_STOCK', 422, `Only ${cartItem.variant.stock} units left in stock`);
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function removeCartItem(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      throw new AppError('NOT_FOUND', 404, 'Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
}

export async function mergeCart(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { items = [] } = req.body; // Array of { variantId, quantity }

    if (!Array.isArray(items)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Items payload must be an array');
    }

    const skippedItems: any[] = [];

    for (const guestItem of items) {
      const { variantId, quantity } = guestItem;

      try {
        const variant = await prisma.productVariant.findFirst({
          where: { id: variantId, isActive: true },
          include: { product: true },
        });

        if (!variant || !variant.product || !variant.product.isActive || variant.product.deletedAt !== null) {
          skippedItems.push({ variantId, reason: 'PRODUCT_UNAVAILABLE' });
          continue;
        }

        // Upsert merging
        await prisma.cartItem.upsert({
          where: {
            userId_variantId: { userId, variantId },
          },
          update: {
            quantity: { increment: quantity },
          },
          create: {
            userId,
            variantId,
            quantity,
          },
        });
      } catch (err) {
        skippedItems.push({ variantId, reason: 'ERROR_MERGING' });
      }
    }

    res.status(200).json({
      message: 'Cart merge completed',
      skippedItems,
    });
  } catch (error) {
    next(error);
  }
}
