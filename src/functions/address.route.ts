// src/functions/address.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getDataSource } from '../config/ds-runtime';
import { AddressService } from '../services/address.service'; // or '../services' if you have a barrel
import { versionedRoute, logErr, logInfo, isJson, json, isGuid, toHttpError } from '../helpers';

// ---- routing ---------------------------------------------------------------
const path = 'addresses';
const prefixRoute = versionedRoute(path); // e.g. api/v1/addresses
const itemRoute = `${prefixRoute}/{id}`; // e.g. api/v1/addresses/{id}

// ---- handlers --------------------------------------------------------------

// LIST with filters & pagination
async function getAddresses(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    logInfo(context, `[${req.method}] ${req.url} Fetching addresses`);
    const ds = await getDataSource();
    const service = new AddressService(ds);

    const url = new URL(req.url);
    const query = {
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
      locationTypeId: url.searchParams.get('locationTypeId') ?? undefined,
      city: url.searchParams.get('city') ?? undefined,
      addressType: url.searchParams.get('addressType') ?? undefined,
    };

    const result = await service.list(query);
    return json(200, result);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// GET by id
async function getAddressById(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const ds = await getDataSource();
    const service = new AddressService(ds);
    const found = await service.get(id);
    if (!found) return json(404, { error: 'NotFound' });
    return json(200, found);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// CREATE
async function createAddress(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    context.log(`[${req.method}] ${req.url} Creating address`);
    if (!isJson(req))
      return json(415, {
        error: 'UnsupportedMediaType',
        message: 'Content-Type must be application/json',
      });
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'BadRequest', message: 'Invalid JSON body' });

    const ds = await getDataSource();
    const service = new AddressService(ds);
    const created = await service.create(body);
    return json(201, created);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// UPDATE
async function updateAddress(
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
    const service = new AddressService(ds);
    const updated = await service.update(id, body);
    if (!updated) return json(404, { error: 'NotFound' });
    return json(200, updated);
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// DELETE (soft delete)
async function deleteAddress(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const id = req.params['id']!;
    if (!isGuid(id))
      return json(400, { error: 'BadRequest', message: 'Invalid id format (GUID required).' });

    const ds = await getDataSource();
    const service = new AddressService(ds);
    const exists = await service.get(id);
    if (!exists) return json(404, { error: 'NotFound' });

    await service.remove(id);
    return { status: 204 };
  } catch (err: any) {
    logErr(context, err);
    return toHttpError(err);
  }
}

// ---- app routes ------------------------------------------------------------
app.http('getAddresses', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: getAddresses,
});
app.http('getAddressById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: getAddressById,
});
app.http('createAddress', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: prefixRoute,
  handler: createAddress,
});
app.http('updateAddress', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: updateAddress,
});
app.http('deleteAddress', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: itemRoute,
  handler: deleteAddress,
});
