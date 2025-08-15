// src/functions/health.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, withHttp } from '../http';

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
      // Optional runtime/env metadata (only present if set)
      version: process.env.APP_VERSION || process.env.npm_package_version || null,
      commit:
        process.env.BITBUCKET_COMMIT || process.env.SCM_COMMIT_ID || process.env.COMMIT_SHA || null,
      environment: process.env.NODE_ENV || null,
      region: process.env.WEBSITE_REGION || null,
      instanceId: process.env.WEBSITE_INSTANCE_ID || null,
      site: process.env.WEBSITE_SITE_NAME || null,
    };

    // Uses your standard envelope and headers (X-Trace-Id, no-store, etc.)
    return ok(ctx, data);
  },
);

app.http('health', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthHandler,
});
