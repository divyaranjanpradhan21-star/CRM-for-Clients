// Hand-maintained OpenAPI skeleton. Each module adds its paths via registerPaths() as it is built.
export const openapi: any = {
  openapi: '3.0.3',
  info: {
    title: 'CRM API',
    version: '1.0.0',
    description: 'Multi-tenant CRM REST API. All routes are under /api/v1 and return { success, data | error }.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
              requestId: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Liveness and database connectivity check',
        security: [],
        responses: {
          '200': { description: 'Healthy' },
          '503': { description: 'Database unreachable', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export function registerPaths(paths: Record<string, unknown>) {
  Object.assign(openapi.paths, paths);
}
