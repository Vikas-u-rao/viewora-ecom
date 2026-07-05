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
          // Re-fetch within the transaction using a lock or simple check to verify it is still active
          const freshReservation = await tx.stockReservation.findUnique({
            where: { id: reservation.id },
          });

          if (!freshReservation || freshReservation.status !== 'active') {
            continue;
          }

          await tx.productVariant.update({
            where: { id: reservation.variantId },
            data: { stock: { increment: reservation.quantity } },
          });

          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { status: 'released' },
          });

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
