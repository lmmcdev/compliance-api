import { z } from 'zod';

// Request DTOs
export const ExtractionOptionsSchema = z.object({
  features: z.array(z.string()).optional(),
  pages: z.string().optional(),
  locale: z.string().optional(),
});

export const ExtractionRequestSchema = z.object({
  blobName: z.string().min(1, 'Blob name is required'),
  modelId: z.string().optional(),
  options: ExtractionOptionsSchema.optional(),
});

export type ExtractionOptions = z.infer<typeof ExtractionOptionsSchema>;
export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>;

// Response DTOs
export interface AnalyzeResult {
  modelId?: string;
  apiVersion?: string;
  documentsCount?: number;
}

export interface ExtractionResponse {
  result: any;
  analyzeResult?: AnalyzeResult;
  timestamp?: string;
}

// Azure AD Configuration
export interface AzureAdConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

// API Configuration
export interface ApiConfig {
  extractionUrl: string;
}