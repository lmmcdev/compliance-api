import { InvocationContext } from '@azure/functions';
import { ClientSecretCredential } from '@azure/identity';
import { env } from '../../config/env';
import { ExtractionRequest, ExtractionResponse, AzureAdConfig, ApiConfig } from './doc-ai.dto';
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
      extractionUrl: env.AIXAAI_EXTRACTION_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { extractionUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope || !extractionUrl) {
      throw new Error('Missing required Azure AD or API configuration');
    }
  }

  private async getAccessToken(ctx: InvocationContext): Promise<string> {
    const config = this.azureAdConfig;
    ctx.log('Getting access token with config:', config);
    const tokenResponse = await this.tokenManager.getAccessToken(config);
    console.log(tokenResponse.token);

    ctx.log('Token response received:', !!tokenResponse?.token);

    if (!tokenResponse?.token) {
      throw new Error('Failed to obtain Azure AD access token');
    }

    return tokenResponse.token;
  }

  private async callExternalApi(
    url: string,
    request: ExtractionRequest,
    accessToken: string,
    ctx: InvocationContext,
  ): Promise<any> {
    console.log('=== EXTERNAL API REQUEST DEBUG ===');
    console.log('Incoming request object:', JSON.stringify(request, null, 2));
    console.log('Request.blobName:', request.blobName);
    console.log('Request.modelId:', request.modelId);
    console.log('Request.options:', request.options);
    console.log('ModelId check - exists:', !!request.modelId, 'value:', request.modelId);

    const payload = {
      blobName: request.blobName,
      ...(request.modelId && { modelId: request.modelId }),
      ...(request.options && { options: request.options }),
    };

    console.log('=== FINAL PAYLOAD TO SEND ===');
    console.log('Payload object keys:', Object.keys(payload));
    console.log('Payload.blobName:', payload.blobName);
    console.log('Payload.modelId:', payload.modelId);
    console.log('Final JSON payload:', JSON.stringify(payload, null, 2));
    console.log('API URL:', `${url}`);
    console.log('Access token present:', !!accessToken);

    const apiResponse = await fetch(`${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('API Response status:', apiResponse.status);
    console.log('API Response headers:', Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.log('API Error response text:', errorText);
      ctx.error(`API call failed: ${apiResponse.status} - ${errorText}`);

      // Parse the error details if it's JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
        console.log('Parsed error details:', JSON.stringify(errorDetails, null, 2));
      } catch {
        errorDetails = { statusText: apiResponse.statusText, details: errorText };
        console.log('Error details (not JSON):', errorDetails);
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
    console.log('API Success response:', JSON.stringify(apiResult, null, 2));

    if (!apiResult?.success) {
      console.log('API returned unsuccessful response:', apiResult);
      const error = new Error('External API returned unsuccessful response');
      (error as any).code = 'EXTERNAL_API_UNSUCCESSFUL';
      (error as any).details = apiResult;
      throw error;
    }

    console.log('=== END DOC EXTRACTION API CALL DEBUG ===');
    return apiResult;
  }

  async extractDocument(
    request: ExtractionRequest,
    ctx: InvocationContext,
  ): Promise<ExtractionResponse> {
    console.log('=== STARTING DOCUMENT EXTRACTION ===');
    console.log('Incoming request:', JSON.stringify(request, null, 2));

    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callExternalApi(
      this.apiConfig.extractionUrl,
      request,
      accessToken,
      ctx,
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
