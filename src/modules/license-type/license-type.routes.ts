// src/modules/license-type/license-type.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../../infrastructure/ds-runtime';
import { LicenseTypeService } from './license-type.service';
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
import {
  CreateLicenseTypeSchema,
  ListLicenseTypesSchema,
  UpdateLicenseTypeSchema,
} from './license-type.dto';

const path = 'license-types';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

// ---- handlers ----
const licenseTypesListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = parseQuery(req, ListLicenseTypesSchema);
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

const licenseTypesGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const id = (req as any).params?.id as string;
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

const licenseTypesCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateLicenseTypeSchema);
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

const licenseTypesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateLicenseTypeSchema);
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const updated = await service.update(id, dto);
    return ok(ctx, updated);
  },
);

export const licenseTypesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
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
