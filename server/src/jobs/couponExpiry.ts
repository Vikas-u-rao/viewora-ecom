import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { sendCouponExpiryReminder } from '../services/email';

/**
 * Runs daily at 9:00 AM IST.
 * 1. Finds active coupons that have expired and marks them as 'expired'.
 * 2. Finds active coupons expiring in 24-48 hours and sends an email reminder to their owners.
 */
export function startCouponExpiryJob() {
  // '0 9 * * *' = Daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info({ event: 'job_running', job: 'couponExpiry' });
      const now = new Date();

      // 1. Mark expired coupons
      const expiredResult = await prisma.coupon.updateMany({
        where: {
          status: 'active',
          expiresAt: { lt: now },
        },
        data: {
          status: 'expired',
        },
      });

      if (expiredResult.count > 0) {
        logger.info({
          event: 'coupons_expired',
          count: expiredResult.count,
        });
      }

      // 2. Expiry Reminders (24h to 48h before expiration)
      const targetStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const targetEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const expiringSoonCoupons = await prisma.coupon.findMany({
        where: {
          status: 'active',
          expiresAt: {
            gte: targetStart,
            lte: targetEnd,
          },
        },
        include: {
          user: true,
        },
      });

      for (const coupon of expiringSoonCoupons) {
        const email = coupon.user?.email || coupon.guestEmail;
        if (email) {
          await sendCouponExpiryReminder(
            email,
            coupon.code,
            Number(coupon.value),
            coupon.expiresAt
          ).catch((err) => {
            logger.error({
              event: 'expiry_reminder_failed',
              couponCode: coupon.code,
              email,
              err: err.message,
            });
          });
        }
      }
    } catch (err: any) {
      logger.error({ event: 'coupon_job_error', err: err.message }, 'Coupon expiry job failed');
    }
  });

  logger.info({ event: 'job_started', job: 'couponExpiry', interval: 'daily_9am' });
}
