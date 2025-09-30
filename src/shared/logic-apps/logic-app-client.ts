import { InvocationContext } from '@azure/functions';

export interface LogicAppConfig {
  url: string;
  timeout?: number;
}

export interface LogicAppResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  statusCode: number;
}

export class LogicAppClient {
  private config: LogicAppConfig;

  constructor(config: LogicAppConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      ...config,
    };
  }

  private validateConfig(): void {
    if (!this.config.url) {
      throw new Error('Logic App URL is required');
    }

    try {
      new URL(this.config.url);
    } catch {
      throw new Error('Logic App URL is not a valid URL');
    }
  }

  async invoke<TRequest = any, TResponse = any>(
    payload: TRequest,
    ctx?: InvocationContext,
  ): Promise<LogicAppResponse<TResponse>> {
    this.validateConfig();

    if (ctx) {
      ctx.log(`Invoking Logic App: ${this.config.url}`);
      ctx.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (ctx) {
        ctx.log(`Logic App response status: ${response.status}`);
      }

      // For successful responses (2xx)
      if (response.ok) {
        let data: TResponse | undefined;
        const contentType = response.headers.get('content-type');

        // Only try to parse JSON if content-type indicates JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (e) {
            if (ctx) {
              ctx.warn('Failed to parse JSON response, returning without data');
            }
          }
        }

        return {
          success: true,
          data,
          statusCode: response.status,
        };
      }

      // For error responses
      let errorDetails: any;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
      } else {
        errorDetails = await response.text();
      }

      if (ctx) {
        ctx.error(`Logic App call failed: ${response.status}`, errorDetails);
      }

      return {
        success: false,
        error: {
          code: 'LOGIC_APP_ERROR',
          message: `Logic App returned status ${response.status}`,
          details: errorDetails,
        },
        statusCode: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (ctx) {
        ctx.error('Error calling Logic App:', error);
      }

      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorMessage = isTimeout
        ? 'Logic App request timed out'
        : error instanceof Error
          ? error.message
          : 'Unknown error calling Logic App';

      return {
        success: false,
        error: {
          code: isTimeout ? 'LOGIC_APP_TIMEOUT' : 'LOGIC_APP_CALL_FAILED',
          message: errorMessage,
          details: error,
        },
        statusCode: isTimeout ? 408 : 500,
      };
    }
  }

  async invokeWithRetry<TRequest = any, TResponse = any>(
    payload: TRequest,
    ctx?: InvocationContext,
    retries: number = 3,
    delayMs: number = 1000,
  ): Promise<LogicAppResponse<TResponse>> {
    let lastError: LogicAppResponse<TResponse> | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (ctx) {
        ctx.log(`Logic App call attempt ${attempt}/${retries}`);
      }

      const response = await this.invoke<TRequest, TResponse>(payload, ctx);

      if (response.success) {
        return response;
      }

      lastError = response;

      // Don't retry on 4xx errors (client errors)
      if (response.statusCode >= 400 && response.statusCode < 500) {
        if (ctx) {
          ctx.warn(`Logic App returned ${response.statusCode}, not retrying`);
        }
        break;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        if (ctx) {
          ctx.log(`Waiting ${delayMs}ms before retry...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }

    return (
      lastError || {
        success: false,
        error: {
          code: 'LOGIC_APP_MAX_RETRIES',
          message: 'Max retries exceeded',
        },
        statusCode: 500,
      }
    );
  }
}