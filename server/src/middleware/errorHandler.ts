import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Unexpected error — log full stack, return generic response
  logger.error({ err, requestId: (req as any).requestId }, 'Unhandled error');
  console.error("UNHANDLED API ERROR:", err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV !== 'production' ? [err.stack] : [],
    },
  });
}
