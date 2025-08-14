import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../config/ds-runtime';
import { LicenseTypeService } from '../services/license-type.service';
import { versionedRoute, logErr, logInfo } from '../helpers';

const path = 'license-types';
const prefixRoute = versionedRoute(path); // e.g. v1/license-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. v1/license-types/{id}

function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

function isJson(req: HttpRequest) {
  return req.headers.get('content-type')?.includes('application/json');
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
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
    const result = await service.list(page, pageSize);
    return json(200, result);
  } catch (err: any) {
    logErr(context, err);
    if (err?.issues?.length) return json(400, { error: 'ValidationError', details: err.issues });
    return json(500, { error: 'InternalServerError' });
  }
}

// GET BY ID
async function getLicenseTypeById(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const found = await service.get(id);
    if (!found) return json(404, { error: 'Not found' });
    return json(200, found);
  } catch (err: any) {
    logErr(context, err);
    return json(500, { error: 'InternalServerError' });
  }
}

// CREATE
async function createLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req)) return json(415, { error: 'Content-Type must be application/json' });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const created = await service.create(body); // zod validation inside service
    return json(201, created);
  } catch (err: any) {
    logErr(context, err);
    if (err?.issues?.length) return json(400, { error: 'ValidationError', details: err.issues });
    return json(500, { error: 'InternalServerError' });
  }
}

// UPDATE
async function updateLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req)) return json(415, { error: 'Content-Type must be application/json' });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);
    const updated = await service.update(id, body);
    if (!updated) return json(404, { error: 'Not found' });
    return json(200, updated);
  } catch (err: any) {
    logErr(context, err);
    if (err?.issues?.length) return json(400, { error: 'ValidationError', details: err.issues });
    return json(500, { error: 'InternalServerError' });
  }
}

// DELETE (soft delete)
async function deleteLicenseType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LicenseTypeService(ds);

    const exists = await service.get(id);
    if (!exists) return json(404, { error: 'Not found' });

    await service.remove(id);
    return { status: 204 };
  } catch (err: any) {
    logErr(context, err);
    return json(500, { error: 'InternalServerError' });
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
