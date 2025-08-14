import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { versionedRoute, logInfo } from '../helpers';

const path = 'health';
const prefixRoute = versionedRoute(path);

async function health(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  logInfo(context, `Health check endpoint called. Method: ${req.method}, URL: ${req.url}`);
  return {
    status: 200,
    jsonBody: { status: 'ok', timestamp: new Date().toISOString() },
    headers: { 'Content-Type': 'application/json' },
  };
}
app.http('health', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: health,
});

export default health;
