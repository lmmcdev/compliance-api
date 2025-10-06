import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { CognitiveSearchService } from './cognitive-search.service';

const searchPath = 'cognitivesearch';

const { prefixRoute: searchRoute } = createPrefixRoute(searchPath);

const cognitiveSearchService = new CognitiveSearchService();

const handleCognitiveSearchError = (ctx: InvocationContext, err: any, operation: string) => {
  ctx.error(`Error in ${operation}:`, err);

  // Handle specific error types
  if (err.name === 'TypeError' && err.message.includes('json')) {
    return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
  }

  if (err.code === 'EXTERNAL_API_FAILED') {
    return fail(
      ctx,
      HTTP_STATUS.SERVER_ERROR,
      'EXTERNAL_API_FAILED',
      err.message,
      err.details
    );
  }

  if (err.code === 'EXTERNAL_API_UNSUCCESSFUL') {
    return fail(
      ctx,
      HTTP_STATUS.SERVER_ERROR,
      'EXTERNAL_API_UNSUCCESSFUL',
      err.message,
      err.details
    );
  }

  if (err.name === 'AuthenticationError' || err.code === 'AUTHENTICATION_FAILED') {
    return fail(ctx, HTTP_STATUS.UNAUTHORIZED, 'AUTH_ERROR', 'Azure AD authentication failed', err.message);
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'CONNECTION_ERROR', 'Unable to connect to external API', err.message);
  }

  if (err.message.includes('Missing required Azure AD or API configuration')) {
    return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'MISSING_CONFIG', err.message);
  }

  // Generic server error
  return fail(
    ctx,
    HTTP_STATUS.SERVER_ERROR,
    'INTERNAL_ERROR',
    `Internal server error during ${operation}`,
    err.message
  );
};

export const cognitiveSearchHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      console.log('Cognitive Search Request Body:', body);

      // Pass the entire body as-is without strict validation
      const result = await cognitiveSearchService.search(body as any, ctx);
      return ok(ctx, result);

    } catch (err: any) {
      return handleCognitiveSearchError(ctx, err, 'Cognitive Search');
    }
  },
);

// Register Azure Function
app.http('cognitivesearch', {
  methods: ['POST'],
  route: searchRoute,
  authLevel: 'anonymous',
  handler: cognitiveSearchHandler,
});
