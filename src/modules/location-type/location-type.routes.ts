// src/functions/location-type.route.ts
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
import {
  CreateLocationTypeSchema,
  UpdateLocationTypeSchema,
  ListLocationTypesSchema,
} from './location-type.dtos';

import { LocationTypeService } from './location-type.service';
import { getDataSource } from '../../infra/ds-runtime';

const path = 'location-types';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

// -------- Handlers --------

export const locationTypesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListLocationTypesSchema);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const locationTypesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateLocationTypeSchema);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const locationTypesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const locationTypesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const dto = await parseJson(req, UpdateLocationTypeSchema);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const locationTypesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// -------- Routes --------

app.http('locationTypes-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'function',
  handler: locationTypesListHandler,
});

app.http('locationTypes-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'function',
  handler: locationTypesCreateHandler,
});

app.http('locationTypes-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'function',
  handler: locationTypesGetByIdHandler,
});

app.http('locationTypes-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'function',
  handler: locationTypesUpdateHandler,
});

app.http('locationTypes-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'function',
  handler: locationTypesDeleteHandler,
});
