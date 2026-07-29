import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export async function logAdminActivity(
  adminId: string,
  adminEmail: string,
  action: string,
  details?: string,
  ip?: string,
  userAgent?: string
) {
  try {
    await prisma.adminActivityLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        details: details || null,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err: any) {
    logger.error('Failed to log admin activity:', err?.message || err);
  }
}
