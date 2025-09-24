import { z } from 'zod';

// Request DTOs
export const ClassificationRequestSchema = z.object({
  blobName: z.string().min(1, 'Blob name is required'),
});

export type ClassificationRequest = z.infer<typeof ClassificationRequestSchema>;

// Response DTOs
export interface DocumentClassification {
  docType: string;
  confidence: number;
  boundingRegions: number;
  spans: number;
  modelId?: string;
}

export interface AnalyzeResult {
  modelId?: string;
  apiVersion?: string;
  documentsCount?: number;
}

export interface ClassificationResponse {
  result: DocumentClassification[] | null;
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
  classificationUrl: string;
}