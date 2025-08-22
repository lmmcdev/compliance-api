import { z } from 'zod';
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
} from '../../http';
import { CreateAccountSchema, UpdateAccountSchema, ListAccountsSchema } from './account.dto';
import { getDataSource } from '../../infrastructure/ds-runtime';
import { AccountService } from './account.service';

const path = 'accounts';
const { prefixRoute, itemRoute, itemSub } = createPrefixRoute(path);
const billingRoute = itemSub('billing-address');

// -------- Handlers --------

export const accountsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = await parseQuery(req, ListAccountsSchema);
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

const BillingAddressSchema = z.object({
  billingAddressId: z.uuid().nullable().optional(),
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
