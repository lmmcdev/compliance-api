import { InvocationContext } from '@azure/functions';
import { getAccessToken } from '../../shared/access-token-manager';
import { AzureAdConfig } from '../doc-classification';
import { env } from '../../config/env';
import {
  StorageManagerResponse,
  StorageListResponse,
  StorageError,
  CompleteUploadRequest,
  FileUploadFormData,
  UploadRequestHeaders,
  StorageManagerResponseSchema,
} from './storage-manager.dto';

export interface StorageServiceConfig {
  apiUrl: string;
  tokenConfig: AzureAdConfig;
}

export class StorageService {
  private config: StorageServiceConfig;

  constructor() {
    this.config = {
      apiUrl: env.STORAGE_MANAGER_API_URL!,
      tokenConfig: {
        tenantId: env.AZURE_TENANT_ID!,
        clientId: env.AZURE_MGR_CLIENT_ID!,
        clientSecret: env.AZURE_MGR_CLIENT_SECRET!,
        scope: env.AZURE_MGR_API_SCOPE!,
      },
    };
  }

  private validateConfig(): void {
    const { apiUrl, tokenConfig } = this.config;

    if (!apiUrl) {
      throw new Error('Storage Manager API URL is not configured');
    }

    const { tenantId, clientId, clientSecret, scope } = tokenConfig;
    if (!tenantId || !clientId || !clientSecret || !scope) {
      throw new Error('Missing required Azure AD configuration for Storage Manager');
    }
  }

  private async getAuthHeaders(
    ctx: InvocationContext,
    requestId?: string,
  ): Promise<Record<string, string>> {
    console.log('Storage Service initialized with config:', this.config);
    const accessToken = await getAccessToken(this.config.tokenConfig);

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    ctx.log('Obtained access token for Storage Manager API');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['x-request-id'] = requestId;
    }

    return headers;
  }

  private async handleApiResponse<T>(
    response: Response,
    ctx: InvocationContext,
    operation: string,
  ): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      ctx.error(`Storage Manager API ${operation} failed: ${response.status} - ${errorText}`);

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText) as StorageError;
      } catch {
        errorDetails = {
          error: {
            code: 'STORAGE_API_ERROR',
            message: response.statusText,
            details: errorText,
          },
          requestId: response.headers.get('x-request-id') || undefined,
        };
      }

      const error = new Error(`Storage Manager ${operation} failed: ${response.status}`);
      (error as any).code = 'STORAGE_API_FAILED';
      (error as any).details = errorDetails;
      (error as any).status = response.status;
      throw error;
    }

    const result = await response.json();
    return result as T;
  }

  async uploadFile(
    file: Buffer | Blob,
    filename: string,
    contentType: string,
    formData: FileUploadFormData,
    headers: UploadRequestHeaders,
    ctx: InvocationContext,
  ): Promise<StorageManagerResponse> {
    this.validateConfig();

    const uploadFormData = new FormData();
    if (file instanceof Buffer) {
      uploadFormData.append('file', new Blob([file as any], { type: contentType }), filename);
    } else {
      uploadFormData.append('file', file as Blob, filename);
    }
    uploadFormData.append('container', formData.container);

    if (formData.path) {
      uploadFormData.append('path', formData.path);
    }

    if (formData.metadata) {
      uploadFormData.append('metadata', formData.metadata);
    }

    const requestHeaders: Record<string, string> = {
      'x-api-key': headers['x-api-key'],
      'x-request-id': headers['x-request-id'],
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/files/upload`, {
        method: 'POST',
        headers: requestHeaders,
        body: uploadFormData,
      });

      const result = await this.handleApiResponse<StorageManagerResponse>(
        response,
        ctx,
        'file upload',
      );

      // Validate the response structure
      const validationResult = StorageManagerResponseSchema.safeParse(result);
      if (!validationResult.success) {
        ctx.warn('Storage Manager response validation failed:', validationResult.error.issues);
      }

      return result;
    } catch (error) {
      ctx.error('Error uploading file to Storage Manager:', error);
      throw error;
    }
  }

  async getFile(
    container: string,
    blobName: string,
    requestId: string,
    ctx: InvocationContext,
  ): Promise<StorageManagerResponse> {
    this.validateConfig();

    const headers = await this.getAuthHeaders(ctx, requestId);

    try {
      const response = await fetch(
        `${this.config.apiUrl}/files/${encodeURIComponent(container)}/${encodeURIComponent(blobName)}`,
        {
          method: 'GET',
          headers,
        },
      );

      return await this.handleApiResponse<StorageManagerResponse>(response, ctx, 'get file');
    } catch (error) {
      ctx.error('Error getting file from Storage Manager:', error);
      throw error;
    }
  }

  async deleteFile(
    container: string,
    blobName: string,
    requestId: string,
    ctx: InvocationContext,
  ): Promise<{ success: boolean; requestId: string }> {
    this.validateConfig();

    const headers = await this.getAuthHeaders(ctx, requestId);

    try {
      const response = await fetch(
        `${this.config.apiUrl}/files/${encodeURIComponent(container)}/${encodeURIComponent(blobName)}`,
        {
          method: 'DELETE',
          headers,
        },
      );

      if (!response.ok) {
        await this.handleApiResponse(response, ctx, 'delete file');
      }

      return {
        success: true,
        requestId: response.headers.get('x-request-id') || requestId,
      };
    } catch (error) {
      ctx.error('Error deleting file from Storage Manager:', error);
      throw error;
    }
  }

  async listFiles(
    container: string,
    prefix?: string,
    ctx?: InvocationContext,
  ): Promise<StorageListResponse> {
    this.validateConfig();

    if (!ctx) {
      throw new Error('InvocationContext is required for listFiles operation');
    }
    const requestId = ctx.invocationId;
    const headers = await this.getAuthHeaders(ctx, requestId);
    const searchParams = new URLSearchParams();

    if (prefix) {
      searchParams.append('prefix', prefix);
    }
    if (container) {
      searchParams.append('container', container);
    }

    const queryString = searchParams.toString();
    const url = `${this.config.apiUrl}/files/list${queryString ? `?${queryString}` : ''}`;
    ctx.log(`Listing files with URL: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const result = await this.handleApiResponse<StorageListResponse>(response, ctx, 'list files');

      return result;
    } catch (error) {
      ctx.error('Error listing files from Storage Manager:', error);
      throw error;
    }
  }
}
