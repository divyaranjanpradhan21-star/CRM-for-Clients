import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env';

// Single shared client. Phase 2 wraps this with a tenant-scoping extension
// that injects organizationId into every query from the request context.
export const prisma = new PrismaClient({
  log: isProd ? ['error'] : ['warn', 'error'],
});
