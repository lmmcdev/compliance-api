import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { ZapierWebhookService } from './zapier-webhook.service';
import { ZapierWebhookRequestSchema } from './zapier-webhook.dto';

const webhookPath = 'zapier-webhook';

const { prefixRoute: webhookRoute } = createPrefixRoute(webhookPath);

const zapierWebhookService = new ZapierWebhookService();

export const zapierWebhookHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await req.json();

      // Validate request body (flexible validation for Zapier)
      const validationResult = ZapierWebhookRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await zapierWebhookService.processWebhook(validationResult.data, ctx);
      return ok(ctx, result);

    } catch (err: any) {
      ctx.error('Error in zapier webhook:', err);

      // Handle specific error types
      if (err.name === 'TypeError' && err.message.includes('json')) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
      }

      // Generic server error
      return fail(
        ctx,
        HTTP_STATUS.SERVER_ERROR,
        'INTERNAL_ERROR',
        'Internal server error during webhook processing',
        err.message
      );
    }
  },
);

// Register Azure Functions
app.http('zapier-webhook', {
  methods: ['POST'],
  route: webhookRoute,
  authLevel: 'anonymous',
  handler: zapierWebhookHandler,
});