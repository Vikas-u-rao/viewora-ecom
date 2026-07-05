import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';

// Helper to hash token for database storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to sign access token
function signAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
  );
}

// Helper to sign refresh token with jti
function signRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const token = jwt.sign(
    { userId, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );


  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  return { token, expiresAt };
}

// Helper to set refresh cookie
function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  });
}

// POST /auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Name, email, and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPhone = phone ? String(phone).trim() : null;

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new AppError('ALREADY_EXISTS', 409, 'A user with this email already exists');
    }

    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
      if (existingPhone) {
        throw new AppError('ALREADY_EXISTS', 409, 'A user with this phone number already exists');
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new AppError('ALREADY_EXISTS', 409, 'A user with this email or phone number already exists');
      }
      throw err;
    }

    const accessToken = signAccessToken(user.id, user.role);
    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    setRefreshCookie(res, refreshToken, expiresAt);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.passwordHash) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password');
    }

    const accessToken = signAccessToken(user.id, user.role);
    const { token: refreshToken, expiresAt } = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    setRefreshCookie(res, refreshToken, expiresAt);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new AppError('UNAUTHORIZED', 401, 'Refresh token not found');
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    } catch (err) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired refresh token');
    }

    const userId = payload.userId;
    if (!userId || typeof userId !== 'string') {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired refresh token');
    }

    const tokenHash = hashToken(token);

    const tokenRow = await prisma.refreshToken.findFirst({
      where: { tokenHash, userId },
    });

    // Reuse/theft detection: If the refresh token signature is valid but the token is not active in DB (or marked revoked),
    // we assume it's a reuse attempt. We revoke all tokens for this user.
    if (!tokenRow || tokenRow.revokedAt) {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      throw new AppError('UNAUTHORIZED', 401, 'Token reuse detected. Session invalidated.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 401, 'User not found');
    }

    // Invalidate the old token
    await prisma.refreshToken.delete({
      where: { id: tokenRow.id },
    });

    // Generate new pair
    const accessToken = signAccessToken(user.id, user.role);
    const { token: newRefreshToken, expiresAt } = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt,
      },
    });

    setRefreshCookie(res, newRefreshToken, expiresAt);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
}

// POST /auth/logout
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken.deleteMany({
        where: { tokenHash },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

// POST /auth/logout-all
export async function logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (userId) {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    next(error);
  }
}
