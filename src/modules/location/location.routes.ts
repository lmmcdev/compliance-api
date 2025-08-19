// src/functions/location.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseJson,
  parseParams,
  parseQuery,
  withHttp,
} from '../../http';

import { CreateLocationSchema, UpdateLocationSchema, ListLocationsSchema } from './location.dtos';

import { LocationService } from './location.service';
import { getDataSource } from '../../infrastructure/ds-runtime';

const path = 'locations';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

// -------- Handlers --------

export const locationsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListLocationsSchema);
    const ds = await getDataSource();
    const service = new LocationService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const locationsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateLocationSchema);
    const ds = await getDataSource();
    const service = new LocationService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const locationsGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new LocationService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const locationsUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const dto = await parseJson(req, UpdateLocationSchema);
    const ds = await getDataSource();
    const service = new LocationService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const locationsDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new LocationService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// -------- Routes --------

app.http('locations-list', {
  methods: ['GET'],
  route: prefixRoute, // /api/v1/locations (assuming your prefix is applied by createPrefixRoute)
  authLevel: 'function',
  handler: locationsListHandler,
});

app.http('locations-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'function',
  handler: locationsCreateHandler,
});

app.http('locations-getById', {
  methods: ['GET'],
  route: itemRoute, // /api/v1/locations/{id}
  authLevel: 'function',
  handler: locationsGetByIdHandler,
});

app.http('locations-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'function',
  handler: locationsUpdateHandler,
});

app.http('locations-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'function',
  handler: locationsDeleteHandler,
});
