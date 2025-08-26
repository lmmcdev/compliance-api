// src/modules/account/account.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  withHttp,
  ok,
  created,
  noContent,
  parseJson,
  createPrefixRoute,
  IdParamSchema,
  parseQuery,
} from '../../http';
import { z } from 'zod';

import { AccountService } from './account.service';
import { CreateAccountSchema, UpdateAccountSchema, ListAccountsSchema } from './account.dto';

// Nested under /v1/accounts — PK = accountNumber comes from body or query
const { prefixRoute, itemRoute } = createPrefixRoute('accounts');

// ---- Param schemas ----
const AccountParamSchema = z.object({
  accountNumber: z.string().min(1),
});

const AccountParamWithIdSchema = AccountParamSchema.extend({
  id: z.uuid(),
});

// Body for POST comes without PK injection (unlike locations)
const CreateAccountBodySchema = CreateAccountSchema;

// -------- Handlers --------

// List
export const accountsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
    const query = ListAccountsSchema.parse(rawQuery);

    const service = await AccountService.createInstance();
    const page = await service.list(query);
    return ok(ctx, page);
  },
);

// Create
export const accountsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await parseJson(req, CreateAccountBodySchema);
    const dto = CreateAccountSchema.parse(body);

    const service = await AccountService.createInstance();
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

// Get by ID
export const accountsGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountNumber } = await parseQuery(req, AccountParamSchema);
    const service = await AccountService.createInstance();
    const entity = await service.get(id, accountNumber);
    return ok(ctx, entity);
  },
);

// Update
export const accountsUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountNumber } = await parseQuery(req, AccountParamSchema);
    const { ...patch } = await parseJson(req, UpdateAccountSchema);

    const service = await AccountService.createInstance();
    const entity = await service.update(id, accountNumber, patch);
    return ok(ctx, entity);
  },
);

// Delete
export const accountsDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { accountNumber, id } = AccountParamWithIdSchema.parse((req as any).params ?? {});
    const service = await AccountService.createInstance();
    await service.remove(id, accountNumber);
    return noContent(ctx);
  },
);

// Set Billing Address
export const accountsSetBillingAddressHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountNumber } = await parseQuery(req, AccountParamSchema);
    const { billingAddressId } = await parseJson(
      req,
      z.object({ billingAddressId: z.uuid().nullable() }),
    );

    const service = await AccountService.createInstance();
    const entity = await service.setBillingAddress(id, accountNumber, billingAddressId ?? null);
    return ok(ctx, entity);
  },
);

// -------- Azure Functions route registrations --------

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

app.http('accounts-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: accountsGetByIdHandler,
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

app.http('accounts-setBillingAddress', {
  methods: ['PATCH'],
  route: `${itemRoute}/billing-address`,
  authLevel: 'anonymous',
  handler: accountsSetBillingAddressHandler,
});
