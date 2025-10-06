import { InvocationContext } from '@azure/functions';
import { env } from '../../config/env';
import {
  CognitiveSearchRequest,
  CognitiveSearchResponse,
  AzureAdConfig,
  ApiConfig,
} from './cognitive-search.dto';
import { AccessTokenManager } from '../../shared/access-token-manager';

export class CognitiveSearchService {
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
      searchUrl: env.AIXXAAI_COGNITIVE_SEARCH_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { searchUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope) {
      throw new Error('Missing required Azure AD configuration');
    }

    if (!searchUrl) {
      throw new Error('Missing required API configuration');
    }
  }

  private async getAccessToken(ctx: InvocationContext): Promise<string> {
    const config = this.azureAdConfig;
    const tokenResponse = await this.tokenManager.getAccessToken(config);

    ctx.log('Token response received:', !!tokenResponse?.token);

    if (!tokenResponse?.token) {
      throw new Error('Failed to obtain Azure AD access token');
    }

    return tokenResponse.token;
  }

  private async callCognitiveSearchApi(
    url: string,
    request: CognitiveSearchRequest,
    accessToken: string,
    ctx: InvocationContext,
  ): Promise<any> {
    console.log('=== COGNITIVE SEARCH API REQUEST DEBUG ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('API URL:', url);
    console.log('Access token present:', !!accessToken);

    // Pass the entire request body as-is to the external API
    const payload = request;

    console.log('Final JSON payload:', JSON.stringify(payload, null, 2));

    const apiResponse = await fetch(url, {
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

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
        console.log('Parsed error details:', JSON.stringify(errorDetails, null, 2));
      } catch {
        errorDetails = { statusText: apiResponse.statusText, details: errorText };
        console.log('Error details (not JSON):', errorDetails);
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

    console.log('=== END COGNITIVE SEARCH API CALL DEBUG ===');
    return apiResult;
  }

  async search(
    request: CognitiveSearchRequest,
    ctx: InvocationContext,
  ): Promise<CognitiveSearchResponse> {
    console.log('=== STARTING COGNITIVE SEARCH ===');
    console.log('Incoming request:', JSON.stringify(request, null, 2));

    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callCognitiveSearchApi(
      this.apiConfig.searchUrl,
      request,
      accessToken,
      ctx,
    );

    return {
      result: apiResult.data || apiResult,
      timestamp: apiResult.timestamp || new Date().toISOString(),
    };
  }
}
