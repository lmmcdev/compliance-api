import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { OpenAIQueryService } from './openai-query.service';
import { OpenAIQueryRequestSchema } from './openai-query.dto';

const queryPath = 'openaiquery';

const { prefixRoute: queryRoute } = createPrefixRoute(queryPath);

const openAIQueryService = new OpenAIQueryService();

const handleOpenAIQueryError = (ctx: InvocationContext, err: any, operation: string) => {
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

export const openAIQueryHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      console.log('OpenAI Query Request Body:', body);

      // Validate request body
      const validationResult = OpenAIQueryRequestSchema.safeParse(body);
      console.log('Body validated:', validationResult);

      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await openAIQueryService.queryOpenAI(validationResult.data, ctx);
      return ok(ctx, result);

    } catch (err: any) {
      return handleOpenAIQueryError(ctx, err, 'OpenAI query');
    }
  },
);

// Register Azure Function
app.http('openaiquery', {
  methods: ['POST'],
  route: queryRoute,
  authLevel: 'anonymous',
  handler: openAIQueryHandler,
});
