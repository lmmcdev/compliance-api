// src/modules/location/location.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, created, noContent, parseJson } from '../../http';
import { z } from 'zod';

import { LocationService } from './location.service';
import { CreateLocationSchema, UpdateLocationSchema, ListLocationsSchema } from './location.dto';

// Nested under location type so we always have the partition key
const base = 'v1/location-types/{locationTypeId}/locations';

// ---- Param schemas ----
const LTParamSchema = z.object({
  locationTypeId: z.uuid(),
});
const LTParamWithIdSchema = LTParamSchema.extend({
  id: z.uuid(),
});

// Body for POST comes without locationTypeId (we inject from path)
const CreateLocationBodySchema = CreateLocationSchema.omit({ locationTypeId: true });

// -------- Handlers --------

export const locationsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId } = LTParamSchema.parse((req as any).params ?? {});
    const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
    const query = ListLocationsSchema.parse({ ...rawQuery, locationTypeId });

    const service = await LocationService.createInstance();
    const page = await service.list(query); // { items, continuationToken }
    return ok(ctx, page);
  },
);

export const locationsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId } = LTParamSchema.parse((req as any).params ?? {});
    // validate body without PK...
    const body = await parseJson(req, CreateLocationBodySchema);
    // ...then inject PK and validate full DTO
    const dto = CreateLocationSchema.parse({ ...body, locationTypeId });

    const service = await LocationService.createInstance();
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const locationsGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const service = await LocationService.createInstance();
    const entity = await service.get(id, locationTypeId);
    return ok(ctx, entity);
  },
);

export const locationsUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const patch = await parseJson(req, UpdateLocationSchema);
    const service = await LocationService.createInstance();
    const entity = await service.update(id, locationTypeId, patch);
    return ok(ctx, entity);
  },
);

export const locationsDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const service = await LocationService.createInstance();
    await service.remove(id, locationTypeId);
    return noContent(ctx);
  },
);

export const locationsFindByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = z.object({ id: z.string().uuid() }).parse((req as any).params ?? {});
    const service = await LocationService.createInstance();
    const entity = await service.findById(id);
    return ok(ctx, entity);
  },
);

// -------- Azure Functions route registrations --------

app.http('locations-list', {
  methods: ['GET'],
  route: `${base}`,
  authLevel: 'anonymous',
  handler: locationsListHandler,
});

app.http('locations-create', {
  methods: ['POST'],
  route: `${base}`,
  authLevel: 'anonymous',
  handler: locationsCreateHandler,
});

app.http('locations-getById', {
  methods: ['GET'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: locationsGetByIdHandler,
});

app.http('locations-update', {
  methods: ['PUT', 'PATCH'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: locationsUpdateHandler,
});

app.http('locations-delete', {
  methods: ['DELETE'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: locationsDeleteHandler,
});

// Non-partitioned findById (for UI convenience, e.g. when we have just the locationId)
app.http('locations-findById', {
  methods: ['GET'],
  route: `v1/locations/{id}/find`,
  authLevel: 'anonymous',
  handler: locationsFindByIdHandler,
});
