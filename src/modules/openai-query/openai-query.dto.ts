import { z } from 'zod';

// Request DTOs
export const OpenAIOptionsSchema = z.object({
  model: z.string().default('gpt-3.5-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(1000),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

export const OpenAIQueryRequestSchema = z.object({
  systemPrompt: z.string().min(1, 'System prompt is required'),
  userContent: z.string().min(1, 'User content is required'),
  options: OpenAIOptionsSchema.optional(),
});

export type OpenAIOptions = z.infer<typeof OpenAIOptionsSchema>;
export type OpenAIQueryRequest = z.infer<typeof OpenAIQueryRequestSchema>;

// Response DTOs
export interface OpenAIQueryResponse {
  result: any;
  timestamp?: string;
}

// Azure AD Configuration (reusing from doc-ai structure)
export interface AzureAdConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

// API Configuration
export interface ApiConfig {
  queryUrl: string;
}
