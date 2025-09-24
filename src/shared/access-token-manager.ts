import { ClientSecretCredential } from '@azure/identity';
import { AzureAdConfig } from '../modules/doc-ai/doc-ai.dto';

export interface TokenResponse {
  accessToken: string;
  expiresAt: Date;
}

export class AccessTokenManager {
  private tokenCache: Map<string, { token: string; expiresAt: Date }> = new Map();
  private readonly CACHE_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before expiry

  private getCacheKey(config: AzureAdConfig): string {
    return `${config.tenantId}-${config.clientId}-${config.scope}`;
  }

  private isTokenValid(cachedToken: { token: string; expiresAt: Date }): boolean {
    return new Date().getTime() < cachedToken.expiresAt.getTime() - this.CACHE_BUFFER_MS;
  }

  async getAccessToken(config: AzureAdConfig): Promise<TokenResponse> {
    this.validateConfig(config);

    const cacheKey = this.getCacheKey(config);
    const cachedToken = this.tokenCache.get(cacheKey);

    if (cachedToken && this.isTokenValid(cachedToken)) {
      return {
        accessToken: cachedToken.token,
        expiresAt: cachedToken.expiresAt,
      };
    }

    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret,
    );

    const tokenResponse = await credential.getToken(config.scope);

    if (!tokenResponse?.token) {
      throw new Error('Failed to obtain access token from Azure AD');
    }

    const expiresAt = tokenResponse.expiresOnTimestamp
      ? new Date(tokenResponse.expiresOnTimestamp)
      : new Date(Date.now() + 3600000); // Default 1 hour if not provided

    // Cache the token
    this.tokenCache.set(cacheKey, {
      token: tokenResponse.token,
      expiresAt,
    });

    return {
      accessToken: tokenResponse.token,
      expiresAt,
    };
  }

  private validateConfig(config: AzureAdConfig): void {
    const { tenantId, clientId, clientSecret, scope } = config;

    if (!tenantId?.trim()) {
      throw new Error('tenantId is required and cannot be empty');
    }
    if (!clientId?.trim()) {
      throw new Error('clientId is required and cannot be empty');
    }
    if (!clientSecret?.trim()) {
      throw new Error('clientSecret is required and cannot be empty');
    }
    if (!scope?.trim()) {
      throw new Error('scope is required and cannot be empty');
    }
  }

  clearCache(config?: AzureAdConfig): void {
    if (config) {
      const cacheKey = this.getCacheKey(config);
      this.tokenCache.delete(cacheKey);
    } else {
      this.tokenCache.clear();
    }
  }
}

// Singleton instance for reuse across the application
export const tokenManager = new AccessTokenManager();

// Convenience function for simple usage
export async function getAccessToken(config: AzureAdConfig): Promise<string> {
  const response = await tokenManager.getAccessToken(config);
  return response.accessToken;
}
