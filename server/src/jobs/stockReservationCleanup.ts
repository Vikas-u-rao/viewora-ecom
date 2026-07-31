import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * Runs every 5 minutes.
 * Finds stock reservations that have passed their expires_at with status=active,
 * releases them (increments variant stock back) and marks them released.
 */
export function startStockCleanupJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await prisma.stockReservation.findMany({
        where: {
          status: 'active',
          expiresAt: { lt: new Date() },
        },
      });

      if (expired.length === 0) return;

      await prisma.$transaction(async (tx) => {
        for (const reservation of expired) {
          // Atomically transition the status from 'active' to 'released'
          // This prevents concurrent execution/multiple app instances from double-releasing
          const updateResult = await tx.stockReservation.updateMany({
            where: { id: reservation.id, status: 'active' },
            data: { status: 'released' },
          });

          if (updateResult.count === 0) {
            // Already released or fulfilled by another transaction
            continue;
          }

          // Safely restore variant stock since we successfully claimed the release
          await tx.productVariant.update({
            where: { id: reservation.variantId },
            data: { stock: { increment: reservation.quantity } },
          });

          // If the order was unpaid and had an applied coupon, release the coupon back to active
          const order = await tx.order.findUnique({ where: { id: reservation.orderId } });
          if (order && order.paymentStatus === 'pending' && order.appliedCouponId) {
            await tx.coupon.updateMany({
              where: { id: order.appliedCouponId, status: 'used' },
              data: { status: 'active', usedAt: null },
            });
          }

          logger.warn({
            event: 'reservation_released',
            reservationId: reservation.id,
            orderId: reservation.orderId,
            variantId: reservation.variantId,
          });
        }
      });
    } catch (err) {
      logger.error({ event: 'cleanup_job_error', err }, 'Stock cleanup job failed');
    }
  });

  logger.info({ event: 'job_started', job: 'stockReservationCleanup', interval: '5min' });
}
