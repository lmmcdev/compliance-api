// src/modules/license-type/license-type.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { LicenseTypeService } from './license-type.service';
import { shallowDiff, safeAuditLog } from '../audit-log/audit-helpers';
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

    // AUDIT: CREATE
    await safeAuditLog({
      entityType: 'licenseType',
      entityId: entity.id,
      action: 'CREATE',
      req,
      message: `LicenseType created (code=${entity.code})`,
      after: {
        id: entity.id,
        code: entity.code,
        displayName: entity.displayName,
        description: entity.description,
      },
    });

    return created(ctx, entity);
  },
);

const licenseTypesUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateLicenseTypeSchema);
    const service = await LicenseTypeService.createInstance();

    const before = await service.get(id);
    const updated = await service.update(id, dto);

    // AUDIT: UPDATE
    const { changes, beforeMini, afterMini } = shallowDiff(
      { code: before.code, displayName: before.displayName, description: before.description },
      { code: updated.code, displayName: updated.displayName, description: updated.description },
    );
    await safeAuditLog({
      entityType: 'licenseType',
      entityId: id,
      action: 'UPDATE',
      req,
      message: `LicenseType updated`,
      changes,
      before: beforeMini,
      after: afterMini,
    });

    return ok(ctx, updated);
  },
);

export const licenseTypesDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const service = await LicenseTypeService.createInstance();

    const before = await service.get(id);
    await service.remove(id);

    // AUDIT: DELETE
    await safeAuditLog({
      entityType: 'licenseType',
      entityId: id,
      action: 'DELETE',
      req,
      message: `LicenseType deleted (code=${before?.code ?? id})`,
      before: {
        id: before?.id,
        code: before?.code,
        displayName: before?.displayName,
        description: before?.description,
      },
    });

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
