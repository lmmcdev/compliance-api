import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, withHttp } from '../http';
import { env } from '../config/env';

const path = 'health';
const { prefixRoute } = createPrefixRoute(path);

export const healthHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const now = new Date();
    const upSecs = Math.floor(process.uptime());
    const upSince = new Date(now.getTime() - upSecs * 1000);

    const data = {
      status: 'ok',
      timestamp: now.toISOString(),
      upSeconds: upSecs,
      upSince: upSince.toISOString(),
      version: env.APP_VERSION ?? null,
      environment: env.NODE_ENV ?? null,
    };

    return ok(ctx, data);
  },
);

app.http('health', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthHandler,
});
