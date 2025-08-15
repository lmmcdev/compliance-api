// src/functions/addresses.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseJson,
  parseQuery,
  withHttp,
} from '../http';
import { CreateAddressSchema, UpdateAddressSchema, ListAddressesSchema } from '../dtos';
import { getDataSource } from '../config/ds-runtime';
import { AddressService } from '../services';

const path = 'addresses';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

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
