import { z } from 'zod';

// Request DTO - accepts any JSON payload
export const CognitiveSearchRequestSchema = z.object({
  extractedData: z.record(z.string(), z.any()).optional(),
}).passthrough(); // Allow any additional properties

export type CognitiveSearchRequest = z.infer<typeof CognitiveSearchRequestSchema>;

// Response DTO
export interface CognitiveSearchResponse {
  result: any;
  timestamp?: string;
}

// Azure AD Configuration (reusing from existing modules)
export interface AzureAdConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

// API Configuration
export interface ApiConfig {
  searchUrl: string;
}
