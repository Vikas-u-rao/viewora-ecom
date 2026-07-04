import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);

  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      requestId: id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });

  next();
}
