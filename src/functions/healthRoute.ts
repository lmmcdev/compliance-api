import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { versionedRoute } from '../helpers/versionHelper';

const path = 'health';
const prefixRoute = versionedRoute(path);

async function health(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Health check endpoint called.');
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
