import { versionedRoute } from '../shared';

type Part = string | null | undefined;

function normalize(...parts: Part[]) {
  return parts
    .filter(Boolean)
    .map((p) =>
      String(p)
        .trim()
        .replace(/^\/+|\/+$/g, ''),
    )
    .filter((p) => p.length > 0)
    .join('/')
    .replace(/\/{2,}/g, '/');
}

export interface PrefixRoute {
  prefixRoute: string;
  itemRoute: string;
  idParamName: string;
  sub: (segment: string) => string;
  itemSub: (segment: string) => string;
  action: (name: string) => string;
  child: (
    childBase: string,
    childIdParamName?: string,
  ) => {
    prefix: string;
    item: string;
    idParamName: string;
  };
}

export type CreatePrefixRouteOptions = {
  idParamName?: string;
  versioner?: (base: string) => string;
  prefixOverride?: string;
};

export const createPrefixRoute = (
  base: string,
  opts: CreatePrefixRouteOptions = {},
): PrefixRoute => {
  const idParamName = opts.idParamName ?? 'id';
  const versioner = opts.versioner ?? versionedRoute;

  const prefixRoute = opts.prefixOverride
    ? normalize(opts.prefixOverride)
    : normalize(versioner(base));

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
