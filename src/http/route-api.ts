// src/http/route.ts

import { versionedRoute } from '../shared';

type Part = string | null | undefined;

function normalize(...parts: Part[]) {
  return parts
    .filter(Boolean)
    .map((p) =>
      String(p)
        .trim()
        .replace(/^\/+|\/+$/g, ''),
    ) // trim both ends
    .filter((p) => p.length > 0)
    .join('/') // no leading slash
    .replace(/\/{2,}/g, '/'); // collapse dupes
}

export interface PrefixRoute {
  prefixRoute: string; // e.g. "v1/accounts"  (no leading slash)
  itemRoute: string; // e.g. "v1/accounts/{id}"
  idParamName: string;
  sub: (segment: string) => string; // "v1/accounts/search"
  itemSub: (segment: string) => string; // "v1/accounts/{id}/billing-address"
  action: (name: string) => string; // "v1/accounts/{id}/activate"
  child: (
    childBase: string,
    childIdParamName?: string,
  ) => {
    prefix: string; // "v1/accounts/{id}/addresses"
    item: string; // "v1/accounts/{id}/addresses/{addressId}"
    idParamName: string;
  };
}

export type CreatePrefixRouteOptions = {
  idParamName?: string;
  versioner?: (base: string) => string; // default: versionedRoute
  prefixOverride?: string; // provide full prefix if you want
};

export const createPrefixRoute = (
  base: string,
  opts: CreatePrefixRouteOptions = {},
): PrefixRoute => {
  const idParamName = opts.idParamName ?? 'id';
  const versioner = opts.versioner ?? versionedRoute;

  // IMPORTANT: no leading slash here
  const prefixRoute = opts.prefixOverride
    ? normalize(opts.prefixOverride)
    : normalize(versioner(base)); // ensure versionedRoute returns something like "v1/accounts"

  const itemRoute = normalize(prefixRoute, `{${idParamName}}`);

  return {
    prefixRoute,
    itemRoute,
    idParamName,
    sub: (segment) => normalize(prefixRoute, segment),
    itemSub: (segment) => normalize(itemRoute, segment),
    action: (name) => normalize(itemRoute, name),
    child: (childBase: string, childIdParamName = `${childBase.replace(/[-\s]/g, '')}Id`) => ({
      prefix: normalize(itemRoute, childBase),
      item: normalize(itemRoute, childBase, `{${childIdParamName}}`),
      idParamName: childIdParamName,
    }),
  };
};
