// src/helpers/versionedRoute.ts
import { env } from '../config/env';

const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');

export const versionedRoute = (
  path: string,
  version: string = env.API_VERSION || 'v1',
  opts?: { includeApiPrefix?: boolean }, // set true if host.json has routePrefix: ""
): string => {
  if (!path) throw new Error('Path is required');

  const includeApi = !!opts?.includeApiPrefix;

  // Normalize inputs
  const v = trim(version);
  const p = trim(path);

  // If version already includes "api", don't add it again
  const parts = [];
  if (includeApi && !/^api(\/|$)/i.test(v)) parts.push('api');
  parts.push(v, p);

  return parts.filter(Boolean).join('/'); // e.g. "v1/accounts" or "api/v1/accounts"
};
