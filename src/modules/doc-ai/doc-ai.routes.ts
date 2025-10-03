import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { DocAiService } from './doc-ai.service';
import { ExtractionRequestSchema, ClassificationRequestSchema } from './doc-ai.dto';

const extractionPath = 'docaiextraction';
const classificationPath = 'docaiclassification';

const { prefixRoute: extractionRoute } = createPrefixRoute(extractionPath);
const { prefixRoute: classificationRoute } = createPrefixRoute(classificationPath);

const docAiService = new DocAiService();

const handleDocAiError = (ctx: InvocationContext, err: any, operation: string) => {
  ctx.error(`Error in ${operation}:`, err);

  // Handle specific error types
  if (err.name === 'TypeError' && err.message.includes('json')) {
    return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
  }

  if (err.code === 'DOCUMENT_INTELLIGENCE_ERROR') {
    return fail(
      ctx,
      HTTP_STATUS.BAD_REQUEST,
      'DOCUMENT_INTELLIGENCE_ERROR',
      err.message,
      err.details
    );
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

export const docAiExtractionHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      console.log("All body", body);
      // Validate request body
      const validationResult = ExtractionRequestSchema.safeParse(body);
      console.log("Body validated", validationResult)
      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await docAiService.extractDocument(validationResult.data, ctx);
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: result
      };

    } catch (err: any) {
      return handleDocAiError(ctx, err, 'document extraction');
    }
  },
);

export const docAiClassificationHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = ClassificationRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await docAiService.classifyDocument(validationResult?.data, ctx);
      console.log("RESULTA", result)
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: result
      };

    } catch (err: any) {
      return handleDocAiError(ctx, err, 'document classification');
    }
  },
);

// Register Azure Functions
app.http('docaiextraction', {
  methods: ['POST'],
  route: extractionRoute,
  authLevel: 'anonymous',
  handler: docAiExtractionHandler,
});

app.http('docaiclassification', {
  methods: ['POST'],
  route: classificationRoute,
  authLevel: 'anonymous',
  handler: docAiClassificationHandler,
});