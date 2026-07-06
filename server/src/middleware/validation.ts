import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/AppError';

export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      // Replace req.body with the sanitized and parsed value
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new AppError('VALIDATION_ERROR', 400, 'Invalid request data', details));
      }
      next(error);
    }
  };
}

// ── Auth Schemas ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Cart Schemas ────────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID format'),
  quantity: z.preprocess(
    (val) => (val === undefined ? 1 : Number(val)),
    z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1')
  ),
});

export const updateCartItemSchema = z.object({
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1')
  ),
});

// ── User Profile & Address Schemas ──────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().nullable(),
});

export const addressSchema = z.object({
  label: z.string().trim().optional().nullable(),
  name: z.string().trim().min(1, 'Name is required'),
  line1: z.string().trim().min(1, 'Address line 1 is required'),
  line2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  pincode: z.string().trim().min(1, 'Pincode is required'),
  isDefault: z.boolean().optional(),
});

