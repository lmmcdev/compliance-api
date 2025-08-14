import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../config/ds-runtime';
import { LocationTypeService } from '../services';
import { versionedRoute, logErr, logInfo, isJson, json } from '../helpers';

const path = 'location-types';
const prefixRoute = versionedRoute(path); // e.g. v1/location-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. v1/location-types/{id}

//LIST
async function getLocationTypes(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    logInfo(context, `[${req.method}] ${req.url} Fetching location types`);
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
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

// get LocationType by ID
async function getLocationTypeById(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const found = await service.get(id);
    if (!found) return json(404, { error: 'Not found' });
    return json(200, found);
  } catch (err: any) {
    logErr(context, err);
    return json(500, { error: 'InternalServerError' });
  }
}

// create
async function createLocationType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req)) return json(415, { error: 'Content-Type must be application/json' });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const created = await service.create(body);
    return json(201, created);
  } catch (err: any) {
    logErr(context, err);
    if (err?.issues?.length) return json(400, { error: 'ValidationError', details: err.issues });
    return json(500, { error: 'InternalServerError' });
  }
}

// update
async function updateLocationType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    if (!isJson(req)) return json(415, { error: 'Content-Type must be application/json' });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body' });

    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);
    const updated = await service.update(id, body);
    if (!updated) return json(404, { error: 'Not found' });
    return json(200, updated);
  } catch (err: any) {
    logErr(context, err);
    if (err?.issues?.length) return json(400, { error: 'ValidationError', details: err.issues });
    return json(500, { error: 'InternalServerError' });
  }
}

// delete (soft delete)
async function deleteLocationType(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    const ds = await getDataSource();
    const service = new LocationTypeService(ds);

    const exists = await service.get(id);
    if (!exists) return json(404, { error: 'Not found' });

    await service.remove(id);
    return { status: 204 };
  } catch (err: any) {
    logErr(context, err);
    return json(500, { error: 'InternalServerError' });
  }
}

// ------- app routes ----
app.http('getLocationTypes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: getLocationTypes,
});

app.http('getLocationTypeById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: getLocationTypeById,
});

app.http('createLocationType', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: createLocationType,
});

app.http('updateLocationType', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: updateLocationType,
});

app.http('deleteLocationType', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: deleteLocationType,
});
