export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  badRequest: (msg = 'Bad request', details?: unknown) => new AppError(400, 'BAD_REQUEST', msg, details),
  validation: (details: unknown) => new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details),
  unauthorized: (msg = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'You do not have permission to perform this action') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`),
  conflict: (msg: string, details?: unknown) => new AppError(409, 'CONFLICT', msg, details),
  tooMany: () => new AppError(429, 'RATE_LIMITED', 'Too many requests, please try again later'),
  notConfigured: (integration: string) =>
    new AppError(501, 'NOT_CONFIGURED', `${integration} is not configured. Add credentials in the environment settings.`),
};
