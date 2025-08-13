import { env } from '../config/env';

export const versionedRoute = (path: string, version: string = env.API_VERSION) => {
  if (!path) throw new Error('Path is required');
  return `${version}/${path}`;
};
