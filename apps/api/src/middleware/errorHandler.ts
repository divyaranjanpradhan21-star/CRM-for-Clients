import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found`, requestId: req.id },
  });
};

function fromPrisma(err: Prisma.PrismaClientKnownRequestError): AppError | null {
  switch (err.code) {
    case 'P2002':
      return new AppError(409, 'CONFLICT', 'A record with these values already exists', { fields: err.meta?.target });
    case 'P2025':
      return new AppError(404, 'NOT_FOUND', 'Record not found');
    case 'P2003':
      return new AppError(409, 'CONFLICT', 'This record is referenced by other data or references a missing record');
    default:
      return null;
  }
}

// Never leaks stack traces or internals in production; always includes requestId for support lookups.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appErr: AppError | null = null;
  if (err instanceof AppError) appErr = err;
  else if (err instanceof Prisma.PrismaClientKnownRequestError) appErr = fromPrisma(err);
  else if (err?.type === 'entity.parse.failed') appErr = new AppError(400, 'BAD_REQUEST', 'Malformed JSON body');

  if (appErr) {
    return res.status(appErr.status).json({
      success: false,
      error: { code: appErr.code, message: appErr.message, details: appErr.details, requestId: req.id },
    });
  }

  logger.error({ err, requestId: req.id, path: req.path }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Something went wrong' : String(err?.message ?? err),
      requestId: req.id,
    },
  });
};
