import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { mapErrorToResponse } from './error-map';

export type HttpHandler = (req: HttpRequest, ctx: InvocationContext) => Promise<HttpResponseInit>;

export function withHttp(handler: HttpHandler): HttpHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return mapErrorToResponse(ctx, err);
    }
  };
}
