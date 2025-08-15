// src/functions/business-license.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseJson,
  parseParams,
  parseQuery,
  withHttp,
} from '../http';
import {
  CreateBusinessLicenseSchema,
  UpdateBusinessLicenseSchema,
  ListBusinessLicensesSchema,
  SetBusinessLicenseStatusSchema,
} from '../dtos';
import { getDataSource } from '../config/ds-runtime';
import { BusinessLicenseService } from '../services';

// Build routes without leading slash; works with routePrefix: "api"
const { prefixRoute, itemRoute } = createPrefixRoute('business-licenses');
// e.g. prefixRoute => "v1/business-licenses", itemRoute => "v1/business-licenses/{id}"

// ---------- Handlers ----------

export const businessLicensesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListBusinessLicensesSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const businessLicensesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateBusinessLicenseSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const businessLicensesGetHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const businessLicensesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const dto = await parseJson(req, UpdateBusinessLicenseSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const businessLicensesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

export const businessLicensesSetStatusHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const statusDto = await parseJson(req, SetBusinessLicenseStatusSchema);
    const ds = await getDataSource();
    const service = new BusinessLicenseService(ds);
    const entity = await service.setStatus(id, statusDto);
    return ok(ctx, entity);
  },
);

// ---------- Routes ----------

app.http('business-licenses-list', {
  methods: ['GET'],
  route: prefixRoute, // v1/business-licenses
  authLevel: 'function',
  handler: businessLicensesListHandler,
});

app.http('business-licenses-create', {
  methods: ['POST'],
  route: prefixRoute, // v1/business-licenses
  authLevel: 'function',
  handler: businessLicensesCreateHandler,
});

app.http('business-licenses-get', {
  methods: ['GET'],
  route: itemRoute, // v1/business-licenses/{id}
  authLevel: 'function',
  handler: businessLicensesGetHandler,
});

app.http('business-licenses-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute, // v1/business-licenses/{id}
  authLevel: 'function',
  handler: businessLicensesUpdateHandler,
});

app.http('business-licenses-delete', {
  methods: ['DELETE'],
  route: itemRoute, // v1/business-licenses/{id}
  authLevel: 'function',
  handler: businessLicensesDeleteHandler,
});

app.http('business-licenses-set-status', {
  methods: ['PATCH'],
  route: `${itemRoute}/status`, // v1/business-licenses/{id}/status
  authLevel: 'function',
  handler: businessLicensesSetStatusHandler,
});
