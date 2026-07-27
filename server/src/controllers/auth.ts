import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { sendOtpEmail } from '../services/email';

// Helper to hash refresh token for database storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to hash OTP for secure storage (never store OTPs in plain text)
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Maximum failed OTP attempts before the code is invalidated
const MAX_OTP_ATTEMPTS = 5;

// Helper to sign access token
function signAccessToken(userId: string, role: string): string {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'viewora_default_jwt_access_secret_key_2026';
  return jwt.sign(
    { userId, role },
    secret,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
  );
}

// Helper to sign refresh token with jti
function signRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'viewora_default_jwt_refresh_secret_key_2026';
  const token = jwt.sign(
    { userId, jti: uuidv4() },
    secret,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );

  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new AppError('INTERNAL_ERROR', 500, 'Failed to decode refresh token expiry');
  }
  const expiresAt = new Date(decoded.exp * 1000);

  return { token, expiresAt };
}

// Helper to set refresh cookie
// Using 'lax' (not 'strict') so the cookie is sent after PhonePe payment redirects
function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
  });
}

// Helper to check password strength
function isPasswordStrong(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

// Helper to generate 6-digit OTP (cryptographically secure)
function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// POST /auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone, referrerId } = req.body;

    if (!name || !email || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Name, email, and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = String(name).trim();
    const normalizedPhone = phone ? String(phone).trim() : null;
    const normalizedReferrerId = referrerId ? String(referrerId).trim() : null;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid email format');
    }

    // Validate password strength
    if (!isPasswordStrong(password)) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

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

    if (normalizedReferrerId) {
      const referrer = await prisma.user.findUnique({ where: { id: normalizedReferrerId } });
      if (!referrer) {
        throw new AppError('NOT_FOUND', 404, 'Referrer not found');
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save pending verification info (store hash, not plain OTP)
    await prisma.otpVerification.upsert({
      where: { email: normalizedEmail },
      update: {
        purpose: 'signup',
        otpHash,
        attempts: 0,
        expiresAt,
        name: normalizedName,
        phone: normalizedPhone,
        passwordHash,
        referrerId: normalizedReferrerId,
      },
      create: {
        email: normalizedEmail,
        purpose: 'signup',
        otpHash,
        attempts: 0,
        expiresAt,
        name: normalizedName,
        phone: normalizedPhone,
        passwordHash,
        referrerId: normalizedReferrerId,
      },
    });

    // Send OTP email
    await sendOtpEmail(normalizedEmail, otp, 'signup');

    res.status(200).json({
      message: 'Registration initiated. OTP sent to your email.',
      email: normalizedEmail,
      purpose: 'signup',
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

    // Check if user exists in the verified users table
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Check if user exists in the pending verification table
      const pendingVerification = await prisma.otpVerification.findFirst({
        where: { email: normalizedEmail, purpose: 'signup' },
      });

      if (pendingVerification && pendingVerification.passwordHash) {
        // Verify password for pending user
        const isPasswordValid = await bcrypt.compare(password, pendingVerification.passwordHash);
        if (isPasswordValid) {
          throw new AppError('UNAUTHORIZED', 403, 'Account is not verified');
        }
      }
      
      throw new AppError('UNAUTHORIZED', 401, 'Invalid email or password');
    }

    if (!user.passwordHash) {
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

// POST /auth/verify-otp
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      throw new AppError('VALIDATION_ERROR', 400, 'Email, OTP, and purpose are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find verification request
    const verification = await prisma.otpVerification.findUnique({
      where: { email: normalizedEmail },
    });

    if (!verification || verification.purpose !== purpose) {
      throw new AppError('NOT_FOUND', 404, 'No verification request found for this email');
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { email: normalizedEmail } });
      throw new AppError('VALIDATION_ERROR', 400, 'OTP has expired. Please request a new one.');
    }

    // Check attempt limit before comparing OTP
    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.otpVerification.delete({ where: { email: normalizedEmail } });
      throw new AppError('TOO_MANY_ATTEMPTS', 429, `Too many failed attempts. Please request a new OTP.`);
    }

    // Compare hashed OTP
    const submittedOtpHash = hashOtp(String(otp).trim());
    if (verification.otpHash !== submittedOtpHash) {
      // Increment attempt counter
      await prisma.otpVerification.update({
        where: { email: normalizedEmail },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_OTP_ATTEMPTS - (verification.attempts + 1);
      throw new AppError('UNAUTHORIZED', 400, `Invalid OTP. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'No attempts remaining. Please request a new OTP.'}`);
    }

    if (purpose === 'signup') {
      if (!verification.name || !verification.passwordHash) {
        throw new AppError('INTERNAL_ERROR', 500, 'Verification request corrupted');
      }

      // Check if user exists (edge case)
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        throw new AppError('ALREADY_EXISTS', 409, 'User already verified and created');
      }

      // Create verified user and handle referral
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: verification.name!,
            email: normalizedEmail,
            phone: verification.phone,
            passwordHash: verification.passwordHash!,
          },
        });

        if (verification.referrerId) {
          await tx.referral.create({
            data: {
              referrerId: verification.referrerId,
              referredUserId: newUser.id,
              status: 'pending',
            },
          });
        }

        return newUser;
      });

      // Invalidate the OTP
      await prisma.otpVerification.delete({
        where: { email: normalizedEmail },
      });

      res.status(200).json({
        message: 'Account verified and created successfully.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } else if (purpose === 'forgot_password') {
      // Generate a reset token (JWT) valid for 10 minutes
      const resetToken = jwt.sign(
        { email: normalizedEmail, purpose: 'reset_password' },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: '10m' }
      );

      // Invalidate the OTP
      await prisma.otpVerification.delete({
        where: { email: normalizedEmail },
      });

      res.status(200).json({
        message: 'OTP verified. You can now reset your password.',
        resetToken,
      });
    } else {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid verification purpose');
    }
  } catch (error) {
    next(error);
  }
}

// POST /auth/resend-otp
export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      throw new AppError('VALIDATION_ERROR', 400, 'Email and purpose are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (purpose === 'signup') {
      const verification = await prisma.otpVerification.findUnique({
        where: { email: normalizedEmail },
      });

      if (!verification || verification.purpose !== 'signup') {
        throw new AppError('NOT_FOUND', 404, 'No signup session found for this email. Please register again.');
      }

      await prisma.otpVerification.update({
        where: { email: normalizedEmail },
        data: {
          otpHash: hashOtp(otp),
          attempts: 0, // reset attempts on resend
          expiresAt,
        },
      });

      await sendOtpEmail(normalizedEmail, otp, 'signup');
    } else if (purpose === 'forgot_password') {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        throw new AppError('NOT_FOUND', 404, 'No account found with this email');
      }

      await prisma.otpVerification.upsert({
        where: { email: normalizedEmail },
        update: {
          purpose: 'forgot_password',
          otpHash: hashOtp(otp),
          attempts: 0,
          expiresAt,
          name: null,
          phone: null,
          passwordHash: null,
        },
        create: {
          email: normalizedEmail,
          purpose: 'forgot_password',
          otpHash: hashOtp(otp),
          attempts: 0,
          expiresAt,
        },
      });

      await sendOtpEmail(normalizedEmail, otp, 'forgot_password');
    } else {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid purpose');
    }

    res.status(200).json({
      message: 'OTP resent successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/forgot-password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('VALIDATION_ERROR', 400, 'Email is required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'No account found with this email.');
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create or update verification code
    await prisma.otpVerification.upsert({
      where: { email: normalizedEmail },
      update: {
        purpose: 'forgot_password',
        otpHash: hashOtp(otp),
        attempts: 0,
        expiresAt,
        name: null,
        phone: null,
        passwordHash: null,
      },
      create: {
        email: normalizedEmail,
        purpose: 'forgot_password',
        otpHash: hashOtp(otp),
        attempts: 0,
        expiresAt,
      },
    });

    // Send OTP
    await sendOtpEmail(normalizedEmail, otp, 'forgot_password');

    res.status(200).json({
      message: 'OTP sent to email. Proceed to OTP verification.',
      email: normalizedEmail,
      purpose: 'forgot_password',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/reset-password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      throw new AppError('VALIDATION_ERROR', 400, 'Reset token and password are required');
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET!);
    } catch (err) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired reset token');
    }

    if (decoded.purpose !== 'reset_password' || !decoded.email) {
      throw new AppError('UNAUTHORIZED', 401, 'Invalid or expired reset token');
    }

    // Validate password strength
    if (!isPasswordStrong(password)) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

    const normalizedEmail = decoded.email;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    res.status(200).json({
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
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

    if (!tokenRow || tokenRow.revokedAt) {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // consistent with setRefreshCookie
      });
      throw new AppError('UNAUTHORIZED', 401, 'Token reuse detected. Session invalidated.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 401, 'User not found');
    }

    await prisma.refreshToken.delete({
      where: { id: tokenRow.id },
    });

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
