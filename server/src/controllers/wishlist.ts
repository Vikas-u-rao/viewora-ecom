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
          },
        },
      },
    });

    res.status(200).json(wishlistItems);
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { productId } = req.body;

    if (!productId) {
      throw new AppError('VALIDATION_ERROR', 400, 'productId is required');
    }

    // Verify product exists and is active
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });

    if (!product) {
      throw new AppError('NOT_FOUND', 404, 'Product not found or unavailable');
    }

    const wishlistItem = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {}, // No-op if it already exists
      create: {
        userId,
        productId,
      },
    });

    res.status(200).json(wishlistItem);
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
