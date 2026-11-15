import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env, isProd } from './config/env';
import { logger } from './lib/logger';
import { openapi } from './lib/openapi';
import { requestId } from './middleware/requestId';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/health.routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(pinoHttp({ logger, genReqId: (req) => (req as any).id }));
  app.use(helmet());
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Global limiter; stricter per-route limiters (login, password reset) are added in the auth module.
  app.use(
    '/api',
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false,
      message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } } }),
  );

  const v1 = express.Router();
  v1.use('/health', healthRouter);
  // Phase 2+: v1.use('/auth', authRouter), v1.use('/leads', leadsRouter), ...
  app.use('/api/v1', v1);

  if (!isProd) app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
