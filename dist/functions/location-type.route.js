"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const ds_runtime_1 = require("../config/ds-runtime");
const services_1 = require("../services");
const helpers_1 = require("../helpers");
const path = 'location-types';
const prefixRoute = (0, helpers_1.versionedRoute)(path); // e.g. v1/location-types
const itemRoute = `${prefixRoute}/{id}`; // e.g. v1/location-types/{id}
//LIST
async function getLocationTypes(req, context) {
    try {
        (0, helpers_1.logInfo)(context, `[${req.method}] ${req.url} Fetching location types`);
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new services_1.LocationTypeService(ds);
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
        const result = await service.list(page, pageSize);
        return (0, helpers_1.json)(200, result);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return (0, helpers_1.json)(400, { error: 'ValidationError', details: err.issues });
        return (0, helpers_1.json)(500, { error: 'InternalServerError' });
    }
}
// get LocationType by ID
async function getLocationTypeById(req, context) {
    try {
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new services_1.LocationTypeService(ds);
        const found = await service.get(id);
        if (!found)
            return (0, helpers_1.json)(404, { error: 'Not found' });
        return (0, helpers_1.json)(200, found);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        return (0, helpers_1.json)(500, { error: 'InternalServerError' });
    }
}
// create
async function createLocationType(req, context) {
    try {
        if (!(0, helpers_1.isJson)(req))
            return (0, helpers_1.json)(415, { error: 'Content-Type must be application/json' });
        const body = await req.json().catch(() => null);
        if (!body)
            return (0, helpers_1.json)(400, { error: 'Invalid JSON body' });
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new services_1.LocationTypeService(ds);
        const created = await service.create(body);
        return (0, helpers_1.json)(201, created);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return (0, helpers_1.json)(400, { error: 'ValidationError', details: err.issues });
        return (0, helpers_1.json)(500, { error: 'InternalServerError' });
    }
}
// update
async function updateLocationType(req, context) {
    try {
        if (!(0, helpers_1.isJson)(req))
            return (0, helpers_1.json)(415, { error: 'Content-Type must be application/json' });
        const body = await req.json().catch(() => null);
        if (!body)
            return (0, helpers_1.json)(400, { error: 'Invalid JSON body' });
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new services_1.LocationTypeService(ds);
        const updated = await service.update(id, body);
        if (!updated)
            return (0, helpers_1.json)(404, { error: 'Not found' });
        return (0, helpers_1.json)(200, updated);
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        if (err?.issues?.length)
            return (0, helpers_1.json)(400, { error: 'ValidationError', details: err.issues });
        return (0, helpers_1.json)(500, { error: 'InternalServerError' });
    }
}
// delete (soft delete)
async function deleteLocationType(req, context) {
    try {
        const id = req.params['id'];
        const ds = await (0, ds_runtime_1.getDataSource)();
        const service = new services_1.LocationTypeService(ds);
        const exists = await service.get(id);
        if (!exists)
            return (0, helpers_1.json)(404, { error: 'Not found' });
        await service.remove(id);
        return { status: 204 };
    }
    catch (err) {
        (0, helpers_1.logErr)(context, err);
        return (0, helpers_1.json)(500, { error: 'InternalServerError' });
    }
}
// ------- app routes ----
functions_1.app.http('getLocationTypes', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: prefixRoute,
    handler: getLocationTypes,
});
functions_1.app.http('getLocationTypeById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: getLocationTypeById,
});
functions_1.app.http('createLocationType', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: prefixRoute,
    handler: createLocationType,
});
functions_1.app.http('updateLocationType', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: updateLocationType,
});
functions_1.app.http('deleteLocationType', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: itemRoute,
    handler: deleteLocationType,
});
//# sourceMappingURL=location-type.route.js.map