// src/modules/address/address.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  withHttp,
  ok,
  created,
  noContent,
  parseJson,
  createPrefixRoute,
  parseQuery,
} from '../../http';
import { z } from 'zod';

import { AddressService } from './address.service';
import { CreateAddressSchema, UpdateAddressSchema, ListAddressesSchema } from './address.dto';
import { shallowDiff, safeAuditLog } from '../audit-log/audit-helpers';

// ----- Route base: nested under LocationType (ensures PK is always present)
const base = 'v1/location-types/{locationTypeId}/addresses';
const path = 'addresses';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

//------temp-----------------
// ----- Param schemas
const LTParamSchema = z.object({
  locationTypeId: z.uuid(),
});
const LTParamWithIdSchema = LTParamSchema.extend({
  id: z.uuid(),
});
//------temp-----------------

// -------- Handlers --------

export const addressesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { locationTypeId, ...query } = await parseQuery(req, ListAddressesSchema);

    const service = await AddressService.createInstance();
    const page = await service.list({ locationTypeId, ...query });
    return ok(ctx, page);
  },
);

export const addressesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const dto = await parseJson(req, CreateAddressSchema);

      ctx.log(`[address.routes] Creating address for locationTypeId ${dto.locationTypeId}`);

      const service = await AddressService.createInstance();
      const entity = await service.create(dto);

      ctx.log(
        `[address.routes] Created address ${entity.id} for locationTypeId ${dto.locationTypeId}`,
      );
      // AUDIT: CREATE
      await safeAuditLog({
        entityType: 'addresses',
        entityId: entity.id,
        action: 'CREATE',
        req,
        message: `addresses created (code=${entity.addressType})`,
        after: {
          id: entity.id,
        },
      });
      const response: HttpResponseInit = created(ctx, entity);
      return response;
    } catch (error) {
      ctx.error(error);
      throw error;
    }
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
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: addressesListHandler,
});

app.http('addresses-create', {
  methods: ['POST'],
  route: prefixRoute,
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
