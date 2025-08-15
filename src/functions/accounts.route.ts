// src/functions/accounts.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp } from '../http/with-http';
import { parseJson, parseQuery } from '../http/request';
import { ok, created, noContent, paginated } from '../http/respond';
import { CreateAccountSchema, UpdateAccountSchema, ListAccountsSchema } from '../dtos';
import { getDataSource } from '../config/ds-runtime';
import { AccountService } from '../services/account.service';
import { versionedRoute } from '../helpers';
import { z } from 'zod';
import { IdParamSchema } from '../http/param';

const path = 'accounts';
export const prefixRoute = versionedRoute(path); // e.g. api/v1/accounts
export const itemRoute = `${prefixRoute}/{id}`; // e.g. api/v1/accounts/{id}
export const billingRoute = `${itemRoute}/billing-address`;

// -------- Handlers --------

export const accountsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListAccountsSchema);
    const ds = await getDataSource();
    const service = new AccountService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const accountsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateAccountSchema);
    const ds = await getDataSource();
    const service = new AccountService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const accountsGetHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const ds = await getDataSource();
    const service = new AccountService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const accountsUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateAccountSchema);
    const ds = await getDataSource();
    const service = new AccountService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const accountsDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const ds = await getDataSource();
    const service = new AccountService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// PATCH /billing-address (set/unset)
const BillingAddressSchema = z.object({
  billingAddressId: z.string().uuid().nullable().optional(), // null or UUID to clear/set
});

export const accountsSetBillingAddressHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { billingAddressId } = await parseJson(req, BillingAddressSchema);
    const ds = await getDataSource();
    const service = new AccountService(ds);
    const entity = await service.setBillingAddress(id, billingAddressId ?? null);
    return ok(ctx, entity);
  },
);

// -------- Routes --------

app.http('accounts-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: accountsListHandler,
});

app.http('accounts-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: accountsCreateHandler,
});

app.http('accounts-get', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: accountsGetHandler,
});

app.http('accounts-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: accountsUpdateHandler,
});

app.http('accounts-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: accountsDeleteHandler,
});

app.http('accounts-set-billing-address', {
  methods: ['PATCH'],
  route: billingRoute,
  authLevel: 'anonymous',
  handler: accountsSetBillingAddressHandler,
});
