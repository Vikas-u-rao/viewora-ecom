import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';
import { sendSubscriptionConfirmationEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

const subscribeHandler: RequestHandler = async (req, res, next): Promise<void> => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Valid email is required.' } });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Valid email is required.' } });
    return;
  }

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: { code: 'ALREADY_SUBSCRIBED', message: 'This email is already subscribed.' } });
      return;
    }

    await prisma.subscriber.create({
      data: { email },
    });

    await sendSubscriptionConfirmationEmail(email);

    res.status(200).json({ message: 'Subscription successful.' });
  } catch (error) {
    logger.error({ msg: 'Subscription error', error });
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to subscribe.' } });
  }
};

router.post('/', subscribeHandler);

export default router;
