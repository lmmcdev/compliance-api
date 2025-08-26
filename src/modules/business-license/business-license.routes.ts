// src/modules/business-license/business-license.routes.ts
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

import { BusinessLicenseService } from './business-license.service';
import {
  CreateBusinessLicenseSchema,
  UpdateBusinessLicenseSchema,
  ListBusinessLicensesSchema,
  SetStatusSchema,
  SetActiveSchema,
} from './business-license.dto';

const path = 'business-licenses';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

const PKQuerySchema = z.object({ accountId: z.string().uuid() });

// list
export const blListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const q = await parseQuery(req, ListBusinessLicensesSchema);
    const svc = await BusinessLicenseService.createInstance();
    const page = await svc.list(q);
    return ok(ctx, page);
  },
);

// create
export const blCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateBusinessLicenseSchema);
    const svc = await BusinessLicenseService.createInstance();
    const entity = await svc.create(dto);
    return created(ctx, entity);
  },
);

// get
export const blGetHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const svc = await BusinessLicenseService.createInstance();
    const entity = await svc.get(id, accountId);
    return ok(ctx, entity);
  },
);

// update
export const blUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const patch = await parseJson(req, UpdateBusinessLicenseSchema);
    const svc = await BusinessLicenseService.createInstance();
    const entity = await svc.update(id, accountId, patch);
    return ok(ctx, entity);
  },
);

// delete
export const blDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const svc = await BusinessLicenseService.createInstance();
    await svc.remove(id, accountId);
    return noContent(ctx);
  },
);

// PATCH status
export const blPatchStatusHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const body = await parseJson(req, SetStatusSchema);
    const etag = req.headers.get('if-match') ?? undefined;
    const svc = await BusinessLicenseService.createInstance();
    const entity = await svc.setStatus(id, accountId, body, etag);
    return ok(ctx, entity);
  },
);

// PATCH active
export const blPatchActiveHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const body = await parseJson(req, SetActiveSchema);
    const etag = req.headers.get('if-match') ?? undefined;
    const svc = await BusinessLicenseService.createInstance();
    const entity = await svc.setActive(id, accountId, body, etag);
    return ok(ctx, entity);
  },
);

// registrations
app.http('business-licenses-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: blListHandler,
});
app.http('business-licenses-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: blCreateHandler,
});
app.http('business-licenses-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: blGetHandler,
});
app.http('business-licenses-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: blUpdateHandler,
});
app.http('business-licenses-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: blDeleteHandler,
});
app.http('business-licenses-patch-status', {
  methods: ['PATCH'],
  route: `${itemRoute}/status`, // /api/v1/business-licenses/{id}/status
  authLevel: 'anonymous',
  handler: blPatchStatusHandler,
});
app.http('business-licenses-patch-active', {
  methods: ['PATCH'],
  route: `${itemRoute}/active`, // /api/v1/business-licenses/{id}/active
  authLevel: 'anonymous',
  handler: blPatchActiveHandler,
});
