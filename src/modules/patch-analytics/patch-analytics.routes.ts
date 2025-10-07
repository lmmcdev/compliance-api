import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { PatchAnalyticsService } from './patch-analytics.service';
import { PatchAnalyticsRequestSchema } from './patch-analytics.dto';

const analyticsPath = 'patchanalytics';

const { prefixRoute: analyticsRoute } = createPrefixRoute(analyticsPath);

let patchAnalyticsService: PatchAnalyticsService;

const handleAnalyticsError = (ctx: InvocationContext, err: any, operation: string) => {
  ctx.error(`Error in ${operation}:`, err);

  // Handle specific error types
  if (err.name === 'TypeError' && err.message.includes('json')) {
    return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
  }

  if (err.message.includes('Cosmos DB') || err.code === 'COSMOS_ERROR') {
    return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'DATABASE_ERROR', 'Error fetching patches from database', err.message);
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

export const patchAnalyticsHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Initialize service if not already done
      if (!patchAnalyticsService) {
        patchAnalyticsService = await PatchAnalyticsService.createInstance();
      }

      // Parse body, allow empty body for no filters
      let body: any = {};
      try {
        const text = await req.text();
        if (text && text.trim()) {
          body = JSON.parse(text);
        }
      } catch {
        // Empty body is OK
      }

      console.log('Patch Analytics Request Body:', JSON.stringify(body, null, 2));

      // Validate request body (optional filters)
      const validationResult = PatchAnalyticsRequestSchema.safeParse(body);
      console.log('Body validated:', validationResult.success);

      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await patchAnalyticsService.analyzePatches(validationResult.data, ctx);
      return ok(ctx, result);

    } catch (err: any) {
      return handleAnalyticsError(ctx, err, 'Patch Analytics');
    }
  },
);

// Register Azure Function
app.http('patchanalytics', {
  methods: ['POST'],
  route: analyticsRoute,
  authLevel: 'anonymous',
  handler: patchAnalyticsHandler,
});
