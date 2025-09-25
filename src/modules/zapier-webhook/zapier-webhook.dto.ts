import { z } from 'zod';

// Generic Zapier webhook request schema - accepts any JSON payload
export const ZapierWebhookRequestSchema = z.object({
  // Allow any additional properties since Zapier payloads vary
}).passthrough();

export type ZapierWebhookRequest = z.infer<typeof ZapierWebhookRequestSchema>;

// Response DTOs
export interface ZapierWebhookResponse {
  success: boolean;
  message: string;
  receivedAt: string;
  data?: any;
}