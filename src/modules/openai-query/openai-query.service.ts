import { InvocationContext } from '@azure/functions';
import { env } from '../../config/env';
import {
  OpenAIQueryRequest,
  OpenAIQueryResponse,
  AzureAdConfig,
  ApiConfig,
} from './openai-query.dto';
import { AccessTokenManager } from '../../shared/access-token-manager';

export class OpenAIQueryService {
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
      queryUrl: env.AIXAAI_OPENAI_QUERY_API_URL!,
    };
  }

  private validateConfig(): void {
    const { tenantId, clientId, clientSecret, scope } = this.azureAdConfig;
    const { queryUrl } = this.apiConfig;

    if (!tenantId || !clientId || !clientSecret || !scope) {
      throw new Error('Missing required Azure AD configuration');
    }

    if (!queryUrl) {
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

  private async callOpenAIQueryApi(
    url: string,
    request: OpenAIQueryRequest,
    accessToken: string,
    ctx: InvocationContext,
  ): Promise<any> {
    console.log('=== OPENAI QUERY API REQUEST DEBUG ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    console.log('API URL:', url);
    console.log('Access token present:', accessToken);

    const payload = {
      systemPrompt: request.systemPrompt,
      userContent: request.userContent,
      options: request.options || {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
      },
    };

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

    console.log('=== END OPENAI QUERY API CALL DEBUG ===');
    return apiResult;
  }

  async queryOpenAI(
    request: OpenAIQueryRequest,
    ctx: InvocationContext,
  ): Promise<OpenAIQueryResponse> {
    console.log('=== STARTING OPENAI QUERY ===');
    console.log('Incoming request:', JSON.stringify(request, null, 2));

    this.validateConfig();

    const accessToken = await this.getAccessToken(ctx);
    const apiResult = await this.callOpenAIQueryApi(
      this.apiConfig.queryUrl,
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
