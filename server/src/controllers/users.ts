import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { sendOtpEmail } from '../services/email';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// GET /users/me
export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

// PATCH /users/me
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { name, email, phone } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== currentUser.email) {
        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'Direct email modification is not allowed. Please use /users/me/email-change/request to request an email change with verification.'
        );
      }
    }

    if (phone !== undefined) {
      const normalizedPhone = phone ? phone.trim() : null;
      if (normalizedPhone) {
        // Check duplicate phone
        const existingPhone = await prisma.user.findFirst({
          where: { phone: normalizedPhone },
        });
        if (existingPhone && existingPhone.id !== userId) {
          throw new AppError('ALREADY_EXISTS', 409, 'A user with this phone number already exists');
        }
      }
      updateData.phone = normalizedPhone;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

// GET /users/me/addresses
export async function getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { id: 'asc' },
      ],
    });
    res.status(200).json(addresses);
  } catch (error) {
    next(error);
  }
}

// POST /users/me/addresses
export async function addAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { label, name, phone, line1, line2, city, state, pincode, isDefault = false } = req.body;

    // Check if it's default
    if (isDefault) {
      // Unset all existing defaults
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if user has any addresses. If they have none, force isDefault to true
    const count = await prisma.address.count({ where: { userId } });
    const finalDefault = count === 0 ? true : isDefault;

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label: label || null,
        name,
        phone: phone || null,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        isDefault: finalDefault,
      },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
}

// PUT /users/me/addresses/:id
export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    // Check ownership
    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError('NOT_FOUND', 404, 'Address not found');
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        label: label !== undefined ? (label || null) : undefined,
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        line1: line1 !== undefined ? line1 : undefined,
        line2: line2 !== undefined ? (line2 || null) : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        pincode: pincode !== undefined ? pincode : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    });

    res.status(200).json(updatedAddress);
  } catch (error) {
    next(error);
  }
}

// DELETE /users/me/addresses/:id
export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check ownership
    const address = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError('NOT_FOUND', 404, 'Address not found');
    }

    const wasDefault = address.isDefault;

    await prisma.address.delete({
      where: { id },
    });

    // If we deleted the default address, set another address as default (if one exists)
    if (wasDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: { userId },
      });
      if (remainingAddress) {
        await prisma.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /users/me/email-change/request
export async function requestEmailChange(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { newEmail } = req.body;

    if (!newEmail || typeof newEmail !== 'string') {
      throw new AppError('VALIDATION_ERROR', 400, 'New email address is required');
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    if (normalizedEmail === currentUser.email) {
      throw new AppError('VALIDATION_ERROR', 400, 'New email must be different from current email');
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError('ALREADY_EXISTS', 409, 'A user with this email address already exists');
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.upsert({
      where: { email: normalizedEmail },
      update: {
        purpose: 'email_change',
        otpHash: hashOtp(otp),
        attempts: 0,
        expiresAt,
        name: userId,
      },
      create: {
        email: normalizedEmail,
        purpose: 'email_change',
        otpHash: hashOtp(otp),
        attempts: 0,
        expiresAt,
        name: userId,
      },
    });

    await sendOtpEmail(normalizedEmail, otp, 'email_change');

    res.status(200).json({
      message: 'Email change verification code sent to new email address.',
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
}

// POST /users/me/email-change/verify
export async function verifyEmailChange(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { newEmail, otp } = req.body;

    if (!newEmail || !otp) {
      throw new AppError('VALIDATION_ERROR', 400, 'New email and OTP are required');
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    const verification = await prisma.otpVerification.findUnique({
      where: { email: normalizedEmail },
    });

    if (!verification || verification.purpose !== 'email_change' || verification.name !== userId) {
      throw new AppError('NOT_FOUND', 404, 'No pending email change request found');
    }

    if (verification.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { email: normalizedEmail } });
      throw new AppError('VALIDATION_ERROR', 400, 'OTP has expired. Please request a new one.');
    }

    if (verification.otpHash !== hashOtp(String(otp).trim())) {
      throw new AppError('UNAUTHORIZED', 400, 'Invalid OTP code');
    }

    // Update user email
    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
    });

    await prisma.otpVerification.delete({ where: { email: normalizedEmail } });

    res.status(200).json({
      message: 'Email updated and verified successfully.',
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /users/me
export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.cartItem.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
}

