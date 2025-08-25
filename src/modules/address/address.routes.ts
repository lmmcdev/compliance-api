// src/modules/address/address.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, created, noContent, parseJson } from '../../http';
import { z } from 'zod';

import { AddressService } from './address.service';
import { CreateAddressSchema, UpdateAddressSchema, ListAddressesSchema } from './address.dto';
import en from 'zod/v4/locales/en.cjs';
import { audit } from '../audit-log/audit';

// ----- Route base: nested under LocationType (ensures PK is always present)
const base = 'v1/location-types/{locationTypeId}/addresses';

// ----- Param schemas
const LTParamSchema = z.object({
  locationTypeId: z.uuid(),
});
const LTParamWithIdSchema = LTParamSchema.extend({
  id: z.uuid(),
});

// For POST body: we take locationTypeId from the URL, so omit it from body parsing
const CreateAddressBodySchema = CreateAddressSchema.omit({ locationTypeId: true });

// -------- Handlers --------

export const addressesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId } = LTParamSchema.parse((req as any).params ?? {});

    // Merge query params with the path param, then validate
    const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
    const query = ListAddressesSchema.parse({
      ...rawQuery,
      locationTypeId,
    });

    const service = await AddressService.createInstance();
    const page = await service.list(query); // { items, continuationToken }
    return ok(ctx, page);
  },
);

export const addressesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId } = LTParamSchema.parse((req as any).params ?? {});

    // Validate body without locationTypeId...
    const body = await parseJson(req, CreateAddressBodySchema);
    // ...then inject the PK from the path and validate full payload
    const dto = CreateAddressSchema.parse({ ...body, locationTypeId });

    const service = await AddressService.createInstance();
    const entity = await service.create(dto);
    if (entity) {
      await audit(ctx, {
        entityType: 'address',
        entityId: entity.id,
        action: 'CREATE',
        actor: {
          id: (req as any).user?.id,
          email: (req as any).user?.email,
          ip: req.headers.get('x-forwarded-for') ?? undefined,
        },
        context: {
          method: req.method,
          path: new URL(req.url).pathname,
          status: 201,
          userAgent: req.headers.get('user-agent') ?? undefined,
        },
        after: { id: entity.id, street: entity.street, city: entity.city }, // keep it small
        message: 'Created address',
      });
    }
    return created(ctx, entity);
  },
);

export const addressesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const service = await AddressService.createInstance();
    const entity = await service.get(id, locationTypeId);
    return ok(ctx, entity);
  },
);

export const addressesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const patch = await parseJson(req, UpdateAddressSchema);
    const service = await AddressService.createInstance();
    const entity = await service.update(id, locationTypeId, patch);
    return ok(ctx, entity);
  },
);

export const addressesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, id } = LTParamWithIdSchema.parse((req as any).params ?? {});
    const service = await AddressService.createInstance();
    await service.remove(id, locationTypeId);
    return noContent(ctx);
  },
);

// -------- Azure Functions route registrations --------

app.http('addresses-list', {
  methods: ['GET'],
  route: `${base}`,
  authLevel: 'anonymous',
  handler: addressesListHandler,
});

app.http('addresses-create', {
  methods: ['POST'],
  route: `${base}`,
  authLevel: 'anonymous',
  handler: addressesCreateHandler,
});

app.http('addresses-getById', {
  methods: ['GET'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: addressesGetByIdHandler,
});

app.http('addresses-update', {
  methods: ['PUT', 'PATCH'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: addressesUpdateHandler,
});

app.http('addresses-delete', {
  methods: ['DELETE'],
  route: `${base}/{id}`,
  authLevel: 'anonymous',
  handler: addressesDeleteHandler,
});
