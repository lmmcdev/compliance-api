"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const ds_runtime_1 = require("../config/ds-runtime");
const license_type_service_1 = require("../services/license-type.service");
const helpers_1 = require("../helpers");
const path = 'license-types';
const prefixRoute = (0, helpers_1.versionedRoute)(path); // e.g. v1/license-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. v1/license-types/{id}
function json(status, body) {
    return { status, jsonBody: body };
}
function isJson(req) {
    return req.headers.get('content-type')?.includes('application/json');
}
// LIST
async function getLicenseTypes(req, context) {
    try {
        (0, helpers_1.logInfo)(context, `[${req.method}] ${req.url} Fetching license types`);
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new license_type_service_1.LicenseTypeService(ds);
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
        const result = await service.list(page, pageSize);
        return json(200, result);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return json(400, { error: 'ValidationError', details: err.issues });
        return json(500, { error: 'InternalServerError' });
    }
}
// GET BY ID
async function getLicenseTypeById(req, context) {
    try {
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new license_type_service_1.LicenseTypeService(ds);
        const found = await service.get(id);
        if (!found)
            return json(404, { error: 'Not found' });
        return json(200, found);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        return json(500, { error: 'InternalServerError' });
    }
}
// CREATE
async function createLicenseType(req, context) {
    try {
        if (!isJson(req))
            return json(415, { error: 'Content-Type must be application/json' });
        const body = await req.json().catch(() => null);
        if (!body)
            return json(400, { error: 'Invalid JSON body' });
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new license_type_service_1.LicenseTypeService(ds);
        const created = await service.create(body); // zod validation inside service
        return json(201, created);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return json(400, { error: 'ValidationError', details: err.issues });
        return json(500, { error: 'InternalServerError' });
    }
}
// UPDATE
async function updateLicenseType(req, context) {
    try {
        if (!isJson(req))
            return json(415, { error: 'Content-Type must be application/json' });
        const body = await req.json().catch(() => null);
        if (!body)
            return json(400, { error: 'Invalid JSON body' });
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new license_type_service_1.LicenseTypeService(ds);
        const updated = await service.update(id, body);
        if (!updated)
            return json(404, { error: 'Not found' });
        return json(200, updated);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return json(400, { error: 'ValidationError', details: err.issues });
        return json(500, { error: 'InternalServerError' });
    }
}
// DELETE (soft delete)
async function deleteLicenseType(req, context) {
    try {
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new license_type_service_1.LicenseTypeService(ds);
        const exists = await service.get(id);
        if (!exists)
            return json(404, { error: 'Not found' });
        await service.remove(id);
        return { status: 204 };
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        return json(500, { error: 'InternalServerError' });
    }
}
// ---- app routes ----
functions_1.app.http('getLicenseTypes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: prefixRoute,
    handler: getLicenseTypes,
});
functions_1.app.http('getLicenseTypeById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: getLicenseTypeById,
});
functions_1.app.http('createLicenseType', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: prefixRoute,
    handler: createLicenseType,
});
functions_1.app.http('updateLicenseType', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: updateLicenseType,
});
functions_1.app.http('deleteLicenseType', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: deleteLicenseType,
});
//# sourceMappingURL=license-type.route.js.map