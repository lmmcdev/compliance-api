// src/functions/healthcare-facility.route.ts
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
  CreateHealthcareFacilitySchema,
  UpdateHealthcareFacilitySchema,
  ListHealthcareFacilitiesSchema,
} from './healthcare-facility.dtos';
import { getDataSource } from '../../infra/ds-runtime';
import { HealthcareFacilityService } from './healthcare-facility.service';

const { prefixRoute, itemRoute } = createPrefixRoute('healthcare-facilities');

// -------- Handlers --------

export const healthcareFacilitiesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListHealthcareFacilitiesSchema);
    const ds = await getDataSource();
    const service = new HealthcareFacilityService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const healthcareFacilitiesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateHealthcareFacilitySchema);
    const ds = await getDataSource();
    const service = new HealthcareFacilityService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const healthcareFacilitiesGetHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new HealthcareFacilityService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const healthcareFacilitiesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const dto = await parseJson(req, UpdateHealthcareFacilitySchema);
    const ds = await getDataSource();
    const service = new HealthcareFacilityService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const healthcareFacilitiesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new HealthcareFacilityService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// -------- Routes --------

app.http('healthcare-facilities-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthcareFacilitiesListHandler,
});

app.http('healthcare-facilities-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthcareFacilitiesCreateHandler,
});

app.http('healthcare-facilities-get', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareFacilitiesGetHandler,
});

app.http('healthcare-facilities-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareFacilitiesUpdateHandler,
});

app.http('healthcare-facilities-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareFacilitiesDeleteHandler,
});
