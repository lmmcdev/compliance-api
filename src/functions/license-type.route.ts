import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../config/ds-runtime';
import { LicenseTypeService } from '../services';
import { versionedRoute, logErr, logInfo, isJson, json, toHttpError, isGuid } from '../helpers';
import { LicenseTypeCode } from '../types/enum.type';
import { isLicenseTypeCode } from '../helpers/functions.helper';

const path = 'license-types';
const prefixRoute = versionedRoute(path); // e.g. api/v1/license-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. api/v1/license-types/{id}`

function parsePagination(urlStr: string) {
  const url = new URL(urlStr);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10));
  const rawSize = Number.parseInt(url.searchParams.get('pageSize') || '20', 10);
  const pageSize = Math.max(1, Math.min(rawSize, 100));
  return { page, pageSize };
}

// LIST
async function getLicenseTypes(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    logInfo(context, `[${req.method}] ${req.url} Fetching license types`);
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const { page, pageSize } = parsePagination(req.url);
    const result = await service.list(page, pageSize);
    return json(200, result);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// GET BY ID
async function getLicenseTypeById(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const found = await service.get(id);
    if (!found) return json(404, { error: 'NotFound' });
    return json(200, found);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// CREATE
async function createLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req))
      return json(415, {
        error: 'UnsupportedMediaType',
        message: 'Content-Type must be application/json',
      });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'BadRequest', message: 'Invalid JSON body' });

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const created = await service.create(body); // Zod validation inside service
    return json(201, created);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// UPDATE
async function updateLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req))
      return json(415, {
        error: 'UnsupportedMediaType',
        message: 'Content-Type must be application/json',
      });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'BadRequest', message: 'Invalid JSON body' });

    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const updated = await service.update(id, body);
    if (!updated) return json(404, { error: 'NotFound' });
    return json(200, updated);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// DELETE (soft delete)
async function deleteLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const exists = await service.get(id);
    if (!exists) return json(404, { error: 'NotFound' });

    await service.remove(id);
    return { status: 204 };
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

async function getLicenseTypeByCode(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const codeParam = (req.params['code'] ?? '').trim();

    if (!isLicenseTypeCode(codeParam)) {
      return json(400, { error: 'BadRequest', message: 'Invalid or missing license type code.' });
    }

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const found = await service.findByCode(codeParam);
    if (!found) return json(404, { error: 'NotFound' });
    return json(200, found);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// ---- app routes ----
app.http('getLicenseTypes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: getLicenseTypes,
});
app.http('getLicenseTypeById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: getLicenseTypeById,
});
app.http('createLicenseType', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: createLicenseType,
});
app.http('updateLicenseType', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: updateLicenseType,
});
app.http('deleteLicenseType', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: deleteLicenseType,
});

app.http('getLicenseTypeByCode', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: `${prefixRoute}/code/{code}`,
  handler: getLicenseTypeByCode,
});
