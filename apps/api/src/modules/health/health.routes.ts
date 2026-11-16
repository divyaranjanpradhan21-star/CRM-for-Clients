import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/response';
import { AppError } from '../../lib/errors';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppError(503, 'DB_UNAVAILABLE', 'Database is unreachable');
    }
    res.json({ success: true, data: { status: 'ok', uptimeSec: Math.round(process.uptime()) } });
  }),
);
