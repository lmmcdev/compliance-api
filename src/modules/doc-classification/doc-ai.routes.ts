import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { DocAiService } from './doc-ai.service';
import { ClassificationRequestSchema, ExtractionRequestSchema } from './doc-ai.dto';

const classificationPath = 'docaiclassification';
const extractionPath = 'docaiextraction';

const { prefixRoute: classificationRoute } = createPrefixRoute(classificationPath);
const { prefixRoute: extractionRoute } = createPrefixRoute(extractionPath);

const docAiService = new DocAiService();

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

      const result = await docAiService.classifyDocument(validationResult.data, ctx);
      return ok(ctx, result);

    } catch (err: any) {
      ctx.error('Error in docaiclassification:', err);

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
        'Internal server error during document classification',
        err.message
      );
    }
  },
);

export const docAiExtractionHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      // Validate request body
      const validationResult = ExtractionRequestSchema.safeParse(body);
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
      return ok(ctx, result);

    } catch (err: any) {
      ctx.error('Error in docaiextraction:', err);

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
        'Internal server error during document extraction',
        err.message
      );
    }
  },
);

// Register Azure Functions
app.http('docaiclassification', {
  methods: ['POST'],
  route: classificationRoute,
  authLevel: 'anonymous',
  handler: docAiClassificationHandler,
});

app.http('docaiextraction', {
  methods: ['POST'],
  route: extractionRoute,
  authLevel: 'anonymous',
  handler: docAiExtractionHandler,
});