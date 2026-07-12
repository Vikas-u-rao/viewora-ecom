import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';

export async function getWishlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            variants: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.status(200).json({ wishlistItems });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { productId } = req.body;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      throw new AppError('VALIDATION_ERROR', 400, 'productId must be a non-empty string');
    }

    const cleanProductId = productId.trim();

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: cleanProductId, isActive: true, deletedAt: null },
    });

    if (!product) {
      throw new AppError('NOT_FOUND', 404, 'Product not found or unavailable');
    }

    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId, productId: cleanProductId },
      },
      update: {}, // No-op if already exists
      create: {
        userId,
        productId: cleanProductId,
      },
    });

    res.status(200).json({ wishlistItem });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { itemId } = req.params;

    const item = await prisma.wishlistItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new AppError('NOT_FOUND', 404, 'Wishlist item not found');
    }

    await prisma.wishlistItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({ message: 'Item removed from wishlist' });
  } catch (error) {
    next(error);
  }
}

export async function checkWishlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { productId } = req.params;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      throw new AppError('VALIDATION_ERROR', 400, 'productId is required');
    }

    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId: productId.trim() },
      },
    });

    res.status(200).json({
      wishlisted: !!item,
      itemId: item?.id ?? null,
    });
  } catch (error) {
    next(error);
  }
}
