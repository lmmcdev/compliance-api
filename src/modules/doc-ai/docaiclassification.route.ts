import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ClientSecretCredential } from '@azure/identity';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { env } from '../../config/env';

const path = 'docaiclassification';
const { prefixRoute } = createPrefixRoute(path);

interface ClassificationRequest {
  blobName: string;
}

interface ClassificationResponse {
  result: Array<{
    docType: string;
    confidence: number;
    boundingRegions: number;
    spans: number;
  }> | null;
  analyzeResult?: {
    modelId?: string;
    apiVersion?: string;
    documentsCount?: number;
  };
  timestamp?: string;
}

export const docAiClassificationHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Azure AD Configuration
      const tenantId = env.AZURE_TENANT_ID;
      const clientId = env.AZURE_CLIENT_ID;
      const clientSecret = env.AZURE_CLIENT_SECRET;
      const scope = env.AIXAAI_API_SCOPE;
      const apiUrl = env.AIXAAI_CLASSIFICATION_API_URL;

      if (!tenantId || !clientId || !clientSecret || !scope || !apiUrl) {
        return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'MISSING_CONFIG', 'Missing required Azure AD or API configuration');
      }

      const body = await req.json() as ClassificationRequest;
      const blobName = body?.blobName;

      if (!blobName) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'MISSING_BLOB_NAME', 'Missing blobName in request body');
      }

      // Get Azure AD access token
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const tokenResponse = await credential.getToken(scope);

      ctx.log('Token response received:', !!tokenResponse?.token);

      if (!tokenResponse?.token) {
        return fail(ctx, HTTP_STATUS.UNAUTHORIZED, 'AUTH_FAILED', 'Failed to obtain Azure AD access token');
      }

      // Call external API
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResponse.token}`
        },
        body: JSON.stringify({ blobName })
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
          return fail(
            ctx,
            HTTP_STATUS.BAD_REQUEST,
            'DOCUMENT_INTELLIGENCE_ERROR',
            'Document Intelligence service error - model not found or document processing failed',
            errorDetails
          );
        }

        return fail(
          ctx,
          HTTP_STATUS.SERVER_ERROR,
          'EXTERNAL_API_FAILED',
          'External API call failed',
          errorDetails
        );
      }

      const apiResult = await apiResponse.json();

      // Process aixaai API response structure
      if (!apiResult?.success) {
        return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'EXTERNAL_API_UNSUCCESSFUL', 'External API returned unsuccessful response', apiResult);
      }

      const resultData = apiResult.data?.result;
      const analyzeResult = apiResult.data?.analyzeResult;

      if (!resultData || !Array.isArray(resultData) || resultData.length === 0) {
        const response: ClassificationResponse = {
          result: null,
          analyzeResult: {
            modelId: analyzeResult?.modelId,
            apiVersion: analyzeResult?.apiVersion
          },
          timestamp: apiResult.timestamp
        };

        return ok(ctx, response);
      }

      // Extract docType and confidence from aixaai API response
      const documents = resultData.map(d => ({
        docType: d.docType,
        confidence: d.confidence,
        boundingRegions: d.boundingRegions?.length || 0,
        spans: d.spans?.length || 0
      }));

      const response: ClassificationResponse = {
        result: documents,
        analyzeResult: {
          modelId: analyzeResult?.modelId,
          apiVersion: analyzeResult?.apiVersion,
          documentsCount: documents.length
        },
        timestamp: apiResult.timestamp
      };

      return ok(ctx, response);

    } catch (err: any) {
      ctx.error('Error in docaiclassification:', err);

      // Handle specific error types
      if (err.name === 'TypeError' && err.message.includes('json')) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
      }

      if (err.name === 'AuthenticationError' || err.code === 'AUTHENTICATION_FAILED') {
        return fail(ctx, HTTP_STATUS.UNAUTHORIZED, 'AUTH_ERROR', 'Azure AD authentication failed', err.message);
      }

      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'CONNECTION_ERROR', 'Unable to connect to external API', err.message);
      }

      // Generic server error
      const errorDetails = env.NODE_ENV === 'development' ? err.stack : err.message;
      return fail(
        ctx,
        HTTP_STATUS.SERVER_ERROR,
        'INTERNAL_ERROR',
        'Internal server error during document classification',
        errorDetails
      );
    }
  },
);

app.http('docaiclassification', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: docAiClassificationHandler,
});