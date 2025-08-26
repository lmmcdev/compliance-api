// src/modules/license-type/license-type.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { LicenseTypeService } from './license-type.service';
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
} from '../../http';
import {
  CreateLicenseTypeSchema,
  ListLicenseTypesSchema,
  UpdateLicenseTypeSchema,
} from './license-type.dto';

const path = 'license-types';
const { prefixRoute, itemRoute } = createPrefixRoute(path);
const codeRoute = `${prefixRoute}/code/{code}`;

// ---- handlers ----
const licenseTypesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = await parseQuery(req, ListLicenseTypesSchema);
    const service = await LicenseTypeService.createInstance();
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

const licenseTypesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const service = await LicenseTypeService.createInstance();
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

const licenseTypesGetByCodeHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { code = '' } = parseParams(req, ListLicenseTypesSchema);
    const service = await LicenseTypeService.createInstance();
    const entity = await service.getByCode(code);
    return ok(ctx, entity);
  },
);

const licenseTypesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateLicenseTypeSchema);
    const service = await LicenseTypeService.createInstance();
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

const licenseTypesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateLicenseTypeSchema);
    const service = await LicenseTypeService.createInstance();
    const updated = await service.update(id, dto);
    return ok(ctx, updated);
  },
);

export const licenseTypesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const service = await LicenseTypeService.createInstance();
    await service.remove(id);
    return noContent(ctx);
  },
);

// ---- app routes ----
app.http('license-types-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: licenseTypesListHandler,
});

app.http('license-types-get-by-id', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: licenseTypesGetByIdHandler,
});

app.http('license-types-get-by-code', {
  methods: ['GET'],
  route: codeRoute,
  authLevel: 'anonymous',
  handler: licenseTypesGetByCodeHandler,
});

app.http('license-types-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: licenseTypesCreateHandler,
});

app.http('license-types-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: licenseTypesUpdateHandler,
});

app.http('license-types-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: licenseTypesDeleteHandler,
});
