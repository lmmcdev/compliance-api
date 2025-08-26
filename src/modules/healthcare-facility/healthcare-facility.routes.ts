import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  parseJson,
  parseQuery,
  withHttp,
} from '../../http';
import { z } from 'zod';

import { HealthcareFacilityService } from './healthcare-facility.service';
import {
  CreateHealthcareFacilitySchema,
  UpdateHealthcareFacilitySchema,
  ListHealthcareFacilitiesSchema,
} from './healthcare-facility.dto';

// Prefix-only routes: /api/v1/healthcare-facilities
const path = 'healthcare-facilities';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

// Require PK (accountId) on item routes
const PKQuerySchema = z.object({
  accountId: z.string().uuid(),
});

// -------- Handlers --------

export const facilitiesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Expect: ?accountId=<uuid>&q=&addressId=&pageSize=&token=&sort=&order=
    const q = await parseQuery(req, ListHealthcareFacilitiesSchema);
    const service = await HealthcareFacilityService.createInstance();
    const page = await service.list(q); // { items, continuationToken }
    return ok(ctx, page);
  },
);

export const facilitiesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Body MUST include accountId since it's not in the path
    const dto = await parseJson(req, CreateHealthcareFacilitySchema);
    const service = await HealthcareFacilityService.createInstance();
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const facilitiesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema); // PK required
    const service = await HealthcareFacilityService.createInstance();
    const entity = await service.get(id, accountId);
    return ok(ctx, entity);
  },
);

export const facilitiesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema); // PK required
    const patch = await parseJson(req, UpdateHealthcareFacilitySchema);
    const service = await HealthcareFacilityService.createInstance();
    const entity = await service.update(id, accountId, patch);
    return ok(ctx, entity);
  },
);

export const facilitiesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema); // PK required
    const service = await HealthcareFacilityService.createInstance();
    await service.remove(id, accountId);
    return noContent(ctx);
  },
);

// -------- Azure Functions registrations --------

app.http('healthcare-facilities-list', {
  methods: ['GET'],
  route: prefixRoute, // /api/v1/healthcare-facilities
  authLevel: 'anonymous',
  handler: facilitiesListHandler,
});

app.http('healthcare-facilities-create', {
  methods: ['POST'],
  route: prefixRoute, // /api/v1/healthcare-facilities
  authLevel: 'anonymous',
  handler: facilitiesCreateHandler,
});

app.http('healthcare-facilities-getById', {
  methods: ['GET'],
  route: itemRoute, // /api/v1/healthcare-facilities/{id}
  authLevel: 'anonymous',
  handler: facilitiesGetByIdHandler,
});

app.http('healthcare-facilities-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute, // /api/v1/healthcare-facilities/{id}
  authLevel: 'anonymous',
  handler: facilitiesUpdateHandler,
});

app.http('healthcare-facilities-delete', {
  methods: ['DELETE'],
  route: itemRoute, // /api/v1/healthcare-facilities/{id}
  authLevel: 'anonymous',
  handler: facilitiesDeleteHandler,
});
