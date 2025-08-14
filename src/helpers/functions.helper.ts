import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { env } from '../config/env';

export const versionedRoute = (path: string, version: string = env.API_VERSION) => {
  if (!path) throw new Error('Path is required');
  return `${version}/${path}`;
};

export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

export function isJson(req: HttpRequest) {
  return req.headers.get('content-type')?.includes('application/json');
}
