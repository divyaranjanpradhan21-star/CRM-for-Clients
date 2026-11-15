import process from 'node:process';
import { env } from './config/env';
import { createApp } from './app';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

const app = createApp();
const server = app.listen(env.PORT, () => logger.info(`API listening on :${env.PORT} (docs: /api/docs)`));

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  const timer = setTimeout(() => process.exit(1), 10_000);
  if (typeof (timer as any)?.unref === 'function') {
    (timer as any).unref();
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

