import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';

// POST /api/v1/coupons/validate
export async function validateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, guestEmail, guestPhone } = req.body;

    if (!code) {
      throw new AppError('VALIDATION_ERROR', 400, 'Coupon code is required');
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).trim() },
    });

    if (!coupon) {
      throw new AppError('NOT_FOUND', 404, 'Coupon not found');
    }

    if (coupon.status !== 'active') {
      throw new AppError('VALIDATION_ERROR', 400, 'Coupon is no longer active');
    }

    if (coupon.expiresAt < new Date()) {
      throw new AppError('VALIDATION_ERROR', 400, 'Coupon has expired');
    }

    // Access check: if coupon is user-bound, check user match
    const userId = req.userId;
    if (userId) {
      if (coupon.userId && coupon.userId !== userId) {
        throw new AppError('FORBIDDEN', 403, 'This coupon does not belong to you');
      }
    } else {
      // Guest checks
      if (coupon.guestEmail && (!guestEmail || coupon.guestEmail.toLowerCase() !== String(guestEmail).trim().toLowerCase())) {
        throw new AppError('FORBIDDEN', 403, 'This coupon does not belong to this guest email');
      }
      if (coupon.guestPhone && (!guestPhone || coupon.guestPhone !== String(guestPhone).trim())) {
        throw new AppError('FORBIDDEN', 403, 'This coupon does not belong to this guest phone');
      }
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        value: coupon.value,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/users/me/coupons
export async function getMyCoupons(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('UNAUTHENTICATED', 401, 'Authentication required');
    }

    const coupons = await prisma.coupon.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ coupons });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/users/me/referrals
export async function getMyReferrals(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('UNAUTHENTICATED', 401, 'Authentication required');
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        generatedCoupon: {
          select: {
            code: true,
            value: true,
            status: true,
            expiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const referralLink = `${clientUrl}/register?ref=${userId}`;

    res.json({
      referralCode: userId,
      referralLink,
      referrals,
    });
  } catch (error) {
    next(error);
  }
}
