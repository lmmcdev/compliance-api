import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../config/ds-runtime';
import { LicenseTypeService } from '../services';
import { versionedRoute, logErr, logInfo, isJson, json, toHttpError, isGuid } from '../helpers';
import { LicenseTypeCode } from '../types/enum.type';
import { isLicenseTypeCode } from '../helpers/functions.helper';
import { withHttp } from '../http/with-http';
import { parseJson, parseQuery } from '../http/request';
import { created, noContent, ok, paginated } from '../http/respond';
import { IdParamSchema } from '../http/param';
import {
  CreateLicenseTypeSchema,
  ListLicenseTypesSchema,
  UpdateLicenseTypeSchema,
} from '../dtos/license-type.dto';

const path = 'license-types';
const prefixRoute = versionedRoute(path); // e.g. api/v1/license-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. api/v1/license-types/{id}`

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
    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const dto = await parseJson(req, UpdateLicenseTypeSchema);
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const updated = await service.update(id, dto);
    if (!updated) return json(404, { error: 'NotFound' });
    return json(200, updated);
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
  authLevel: 'function',
  handler: licenseTypesListHandler,
});

app.http('license-types-get-by-id', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'function',
  handler: licenseTypesGetByIdHandler,
});

app.http('license-types-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'function',
  handler: licenseTypesCreateHandler,
});

app.http('license-types-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'function',
  handler: licenseTypesUpdateHandler,
});

app.http('license-types-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'function',
  handler: licenseTypesDeleteHandler,
});
