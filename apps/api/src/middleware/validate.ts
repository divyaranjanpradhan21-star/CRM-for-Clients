import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { Errors } from '../lib/errors';

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

// Validates and REPLACES req.body/query/params with the parsed (coerced, stripped) values.
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const details: Record<string, unknown> = {};
    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (result.success) {
        (req as any)[part] = result.data;
      } else {
        details[part] = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      }
    }
    if (Object.keys(details).length) return next(Errors.validation(details));
    next();
  };
