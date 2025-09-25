import { InvocationContext } from '@azure/functions';
import {
  ZapierWebhookRequest,
  ZapierWebhookResponse,
} from './zapier-webhook.dto';

export class ZapierWebhookService {
  async processWebhook(
    request: ZapierWebhookRequest,
    ctx: InvocationContext
  ): Promise<ZapierWebhookResponse> {
    try {
      // Log the received webhook data
      ctx.log('Received Zapier webhook:', JSON.stringify(request, null, 2));

      // Process the webhook data here
      // You can add your business logic here to handle the Zapier data

      return {
        success: true,
        message: 'Webhook received successfully',
        receivedAt: new Date().toISOString(),
        data: request,
      };
    } catch (error) {
      ctx.error('Error processing Zapier webhook:', error);

      return {
        success: false,
        message: 'Failed to process webhook',
        receivedAt: new Date().toISOString(),
      };
    }
  }
}