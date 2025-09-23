import { InvocationContext } from '@azure/functions';
import { ClientSecretCredential } from '@azure/identity';
import { env } from '../../config/env';
import {
  ClassificationRequest,
  ExtractionRequest,
  ClassificationResponse,
  ExtractionResponse,
  AzureAdConfig,
  ApiConfig,
  DocumentClassification,
} from './doc-ai.dto';

export class DocAiService {
  private azureAdConfig: AzureAdConfig;
  private apiConfig: ApiConfig;

  constructor() {
    this.azureAdConfig = {
      tenantId: env.AZURE_TENANT_ID!,
      clientId: env.AZURE_CLIENT_ID!,
      clientSecret: env.AZURE_CLIENT_SECRET!,
      scope: env.AIXAAI_API_SCOPE!,
    };

    this.apiConfig = {
      classificationUrl: env.AIXAAI_CLASSIFICATION_API_URL!,
      extractionUrl: env.AIXAAI_EXTRACTION_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { classificationUrl, extractionUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope || !classificationUrl || !extractionUrl) {
      throw new Error('Missing required Azure AD or API configuration');
    }
  }

  private async getAccessToken(ctx: InvocationContext): Promise<string> {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResponse = await credential.getToken(scope);

    ctx.log('Token response received:', !!tokenResponse?.token);

    if (!tokenResponse?.token) {
      throw new Error('Failed to obtain Azure AD access token');
    }

    return tokenResponse.token;
  }

  private async callExternalApi(
    url: string,
    blobName: string,
    accessToken: string,
    ctx: InvocationContext
  ): Promise<any> {
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ blobName }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      ctx.error(`API call failed: ${apiResponse.status} - ${errorText}`);

      // Parse the error details if it's JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { statusText: apiResponse.statusText, details: errorText };
      }

      // Check for specific Document Intelligence errors
      if (errorDetails?.error?.code === 'DOCUMENT_INTELLIGENCE_ERROR') {
        const error = new Error('Document Intelligence service error - model not found or document processing failed');
        (error as any).code = 'DOCUMENT_INTELLIGENCE_ERROR';
        (error as any).details = errorDetails;
        throw error;
      }

      const error = new Error('External API call failed');
      (error as any).code = 'EXTERNAL_API_FAILED';
      (error as any).details = errorDetails;
      throw error;
    }

    const apiResult = await apiResponse.json();

    if (!apiResult?.success) {
      const error = new Error('External API returned unsuccessful response');
      (error as any).code = 'EXTERNAL_API_UNSUCCESSFUL';
      (error as any).details = apiResult;
      throw error;
    }

    return apiResult;
  }

  async classifyDocument(
    request: ClassificationRequest,
    ctx: InvocationContext
  ): Promise<ClassificationResponse> {
    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callExternalApi(
      this.apiConfig.classificationUrl,
      request.blobName,
      accessToken,
      ctx
    );

    const resultData = apiResult.data?.result;
    const analyzeResult = apiResult.data?.analyzeResult;

    if (!resultData || !Array.isArray(resultData) || resultData.length === 0) {
      return {
        result: null,
        analyzeResult: {
          modelId: analyzeResult?.modelId,
          apiVersion: analyzeResult?.apiVersion,
        },
        timestamp: apiResult.timestamp,
      };
    }

    // Extract docType and confidence from aixaai API response
    const documents: DocumentClassification[] = resultData.map(d => ({
      docType: d.docType,
      confidence: d.confidence,
      boundingRegions: d.boundingRegions?.length || 0,
      spans: d.spans?.length || 0,
    }));

    return {
      result: documents,
      analyzeResult: {
        modelId: analyzeResult?.modelId,
        apiVersion: analyzeResult?.apiVersion,
        documentsCount: documents.length,
      },
      timestamp: apiResult.timestamp,
    };
  }

  async extractDocument(
    request: ExtractionRequest,
    ctx: InvocationContext
  ): Promise<ExtractionResponse> {
    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callExternalApi(
      this.apiConfig.extractionUrl,
      request.blobName,
      accessToken,
      ctx
    );

    const resultData = apiResult.data?.result;
    const analyzeResult = apiResult.data?.analyzeResult;

    if (!resultData) {
      return {
        result: null,
        analyzeResult: {
          modelId: analyzeResult?.modelId,
          apiVersion: analyzeResult?.apiVersion,
        },
        timestamp: apiResult.timestamp,
      };
    }

    return {
      result: resultData,
      analyzeResult: {
        modelId: analyzeResult?.modelId,
        apiVersion: analyzeResult?.apiVersion,
        documentsCount: Array.isArray(resultData) ? resultData.length : 1,
      },
      timestamp: apiResult.timestamp,
    };
  }
}