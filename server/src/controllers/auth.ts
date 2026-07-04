import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

// Helper to generate access and refresh tokens
function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );
  return { accessToken, refreshToken };
}

// Helper to hash refresh token
import crypto from 'crypto';
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Missing required fields', [
        { field: 'name/email/password', issue: 'required' }
      ]);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Email is already registered');
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new AppError('PHONE_ALREADY_EXISTS', 409, 'Phone number is already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'customer',
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Missing email or password');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new AppError('UNAUTHENTICATED', 401, 'Refresh token missing');
    }

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      throw new AppError('UNAUTHENTICATED', 401, 'Refresh token expired or invalid');
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // Security measure: if token is reused or invalid, revoke all user tokens
      if (storedToken && storedToken.revokedAt) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId },
          data: { revokedAt: new Date() },
        });
        logger.warn({ event: 'token_theft_detected', userId: payload.userId }, 'Reused refresh token detected, all tokens revoked');
      }
      throw new AppError('UNAUTHENTICATED', 401, 'Invalid session token');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    const tokens = generateTokens(user.id, user.role);

    // Save new token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
