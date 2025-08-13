import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

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
  route: 'health',
  authLevel: 'anonymous',
  handler: health,
});
