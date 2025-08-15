// src/functions/addresses.route.ts
import { z } from 'zod';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp } from '../http/with-http';
import { parseJson, parseQuery } from '../http/request';
import { ok, created, noContent, paginated } from '../http/respond';
import { CreateAddressSchema, UpdateAddressSchema, ListAddressesSchema } from '../dtos';
import { getDataSource } from '../config/ds-runtime';
import { AddressService } from '../services/address.service';
import { versionedRoute } from '../helpers';
import { IdParamSchema } from '../http/param';

const path = 'addresses';
export const prefixRoute = versionedRoute(path); // e.g. api/v1/addresses
export const itemRoute = `${prefixRoute}/{id}`; // e.g. api/v1/addresses/{id}

// -------- Handlers --------

export const addressesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListAddressesSchema);
    const ds = await getDataSource();
    const service = new AddressService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const addressesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateAddressSchema);
    const ds = await getDataSource();
    const service = new AddressService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const addressesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const ds = await getDataSource();
    const service = new AddressService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const addressesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateAddressSchema);
    const ds = await getDataSource();
    const service = new AddressService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const addressesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const ds = await getDataSource();
    const service = new AddressService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// -------- Routes --------

app.http('addresses-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'function',
  handler: addressesListHandler,
});

app.http('addresses-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'function',
  handler: addressesCreateHandler,
});

app.http('addresses-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'function',
  handler: addressesGetByIdHandler,
});

app.http('addresses-update', {
  methods: ['PUT'], // keep PUT to match your route catalog; add 'PATCH' if desired
  route: itemRoute,
  authLevel: 'function',
  handler: addressesUpdateHandler,
});

app.http('addresses-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'function',
  handler: addressesDeleteHandler,
});
