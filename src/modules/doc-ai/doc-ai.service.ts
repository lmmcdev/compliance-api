import { InvocationContext } from '@azure/functions';
import { env } from '../../config/env';
import { getModelIdForDocType } from '../../shared/model-mapping.util';
import {
  ExtractionRequest,
  ExtractionResponse,
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
      extractionUrl: env.AIXAAI_EXTRACTION_API_URL!,
      classificationUrl: env.AIXAAI_CLASSIFICATION_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { extractionUrl, classificationUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope) {
      throw new Error('Missing required Azure AD configuration');
    }

    if (!extractionUrl || !classificationUrl) {
      throw new Error('Missing required API configuration');
    }
  }

  private async getAccessToken(ctx: InvocationContext): Promise<string> {
    const config = this.azureAdConfig;
    //ctx.log('Getting access token with config:', config);
    const tokenResponse = await this.tokenManager.getAccessToken(config);

    if (tokenResponse?.token) {
      console.log(tokenResponse.token);
    }

    ctx.log('Token response received:', !!tokenResponse?.token);

    if (!tokenResponse?.token) {
      throw new Error('Failed to obtain Azure AD access token');
    }

    return tokenResponse.token;
  }

  private async callExtractionApi(
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

  private async callClassificationApi(
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

  async extractDocument(
    request: ExtractionRequest,
    ctx: InvocationContext,
  ): Promise<ExtractionResponse> {
    console.log('=== STARTING DOCUMENT EXTRACTION ===');
    console.log('Incoming request:', JSON.stringify(request, null, 2));

    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callExtractionApi(
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

  async classifyDocument(
    request: ClassificationRequest,
    ctx: InvocationContext,
  ): Promise<ClassificationResponse> {
    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callClassificationApi(
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
