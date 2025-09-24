import { InvocationContext } from '@azure/functions';
import { ClientSecretCredential } from '@azure/identity';
import { env } from '../../config/env';
import { getModelIdForDocType } from '../../shared/model-mapping.util';
import {
  ClassificationRequest,
  ClassificationResponse,
  AzureAdConfig,
  ApiConfig,
  DocumentClassification,
} from './doc-ai.dto';
import { AccessTokenManager } from '../../shared/access-token-manager';

export class DocAiService {
  private azureAdConfig: AzureAdConfig;
  private apiConfig: ApiConfig;
  private tokenManager: AccessTokenManager = new AccessTokenManager();

  constructor() {
    this.azureAdConfig = {
      tenantId: env.AZURE_TENANT_ID!,
      clientId: env.AZURE_AIXAAI_CLIENT_ID!,
      clientSecret: env.AZURE_AIXAAI_CLIENT_SECRET!,
      scope: env.AIXAAI_API_SCOPE!,
    };

    this.apiConfig = {
      classificationUrl: env.AIXAAI_CLASSIFICATION_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { classificationUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope || !classificationUrl) {
      throw new Error('Missing required Azure AD or API configuration');
    }
  }

  private async getAccessToken(ctx: InvocationContext): Promise<string> {
    const config = this.azureAdConfig;
    ctx.log('Getting access token with config:', config);
    const tokenResponse = await this.tokenManager.getAccessToken(config);

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
    ctx: InvocationContext,
  ): Promise<any> {
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
        const error = new Error(
          'Document Intelligence service error - model not found or document processing failed',
        );
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
    ctx: InvocationContext,
  ): Promise<ClassificationResponse> {
    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callExternalApi(
      this.apiConfig.classificationUrl,
      request.blobName,
      accessToken,
      ctx,
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
    const documents: DocumentClassification[] = resultData.map((d) => {
      const modelId = getModelIdForDocType(d.docType);
      return {
        docType: d.docType,
        confidence: d.confidence,
        boundingRegions: d.boundingRegions?.length || 0,
        spans: d.spans?.length || 0,
        ...(modelId && { modelId }),
      };
    });

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
}
