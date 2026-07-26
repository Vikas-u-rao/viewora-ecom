import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../lib/AppError';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('UNAUTHENTICATED', 401, 'No token provided'));

  try {
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'viewora_default_jwt_access_secret_key_2026';
    const payload = jwt.verify(token, secret) as any;
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return next(new AppError('UNAUTHENTICATED', 401, 'Token expired or invalid'));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return next(new AppError('FORBIDDEN', 403, 'Admin access required'));
  }
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'viewora_default_jwt_access_secret_key_2026';
      const payload = jwt.verify(token, secret) as any;
      req.userId = payload.userId;
      req.userRole = payload.role;
    } catch {
      // token invalid — continue as guest
    }
  }
  next();
}
