"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const helpers_1 = require("../helpers");
const path = 'health';
const prefixRoute = (0, helpers_1.versionedRoute)(path);
async function health(req, context) {
    (0, helpers_1.logInfo)(context, `Health check endpoint called. Method: ${req.method}, URL: ${req.url}`);
    return {
        status: 200,
        jsonBody: { status: 'ok', timestamp: new Date().toISOString() },
        headers: { 'Content-Type': 'application/json' },
    };
}
functions_1.app.http('health', {
    methods: ['GET'],
    route: prefixRoute,
    authLevel: 'anonymous',
    handler: health,
});
exports.default = health;
//# sourceMappingURL=health.route.js.map