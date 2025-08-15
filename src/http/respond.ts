import { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ApiError, ApiSuccess, Meta, PaginationMeta } from './envelope';
import { HTTP_STATUS } from './status';
import { PageResult } from '../dtos';

function baseHeaders(traceId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Trace-Id': traceId,
  };
}

function json<T>(status: number, body: T, headers: Record<string, string>): HttpResponseInit {
  return { status, headers, jsonBody: body as any };
}

function meta(ctx: InvocationContext, extra?: Partial<Meta>): Meta {
  return { traceId: ctx.invocationId, ...(extra ?? {}) };
}

export function ok<T>(ctx: InvocationContext, data: T, m?: Partial<Meta>): HttpResponseInit {
  const body: ApiSuccess<T> = { success: true, data, meta: meta(ctx, m) };
  return json(HTTP_STATUS.OK, body, baseHeaders(body.meta!.traceId));
}

export function created<T>(ctx: InvocationContext, data: T, m?: Partial<Meta>): HttpResponseInit {
  const body: ApiSuccess<T> = { success: true, data, meta: meta(ctx, m) };
  return json(HTTP_STATUS.CREATED, body, baseHeaders(body.meta!.traceId));
}

export function noContent(ctx: InvocationContext): HttpResponseInit {
  return { status: HTTP_STATUS.NO_CONTENT, headers: baseHeaders(ctx.invocationId) };
}

export function paginated<T>(
  ctx: InvocationContext,
  page: PageResult<T>,
  extra?: Partial<Meta>,
): HttpResponseInit {
  const pagination: PaginationMeta = {
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    totalPages: Math.max(1, Math.ceil(page.total / page.pageSize)),
  };
  const body: ApiSuccess<T[]> = {
    success: true,
    data: page.items,
    meta: meta(ctx, { ...extra, pagination }),
  };
  return json(HTTP_STATUS.OK, body, baseHeaders(body.meta!.traceId));
}

export function fail(
  ctx: InvocationContext,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  fields?: ApiError['error']['fields'],
): HttpResponseInit {
  const body: ApiError = {
    success: false,
    error: { code, message, details, fields },
    meta: meta(ctx),
  };
  return json(status, body, baseHeaders(body.meta!.traceId));
}
