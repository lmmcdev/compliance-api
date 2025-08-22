import { env } from '../config/env';

const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');

export const versionedRoute = (
  path: string,
  version: string = env.API_VERSION || 'v1',
  opts?: { includeApiPrefix?: boolean },
): string => {
  if (!path) throw new Error('Path is required');

  const includeApi = !!opts?.includeApiPrefix;

  const v = trim(version);
  const p = trim(path);

  const parts = [];
  if (includeApi && !/^api(\/|$)/i.test(v)) parts.push('api');
  parts.push(v, p);

  return parts.filter(Boolean).join('/');
};
