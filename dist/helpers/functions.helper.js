"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionedRoute = void 0;
exports.json = json;
exports.isJson = isJson;
const env_1 = require("../config/env");
const versionedRoute = (path, version = env_1.env.API_VERSION) => {
    if (!path)
        throw new Error('Path is required');
    return `${version}/${path}`;
};
exports.versionedRoute = versionedRoute;
function json(status, body) {
    return { status, jsonBody: body };
}
function isJson(req) {
    return req.headers.get('content-type')?.includes('application/json');
}
//# sourceMappingURL=functions.helper.js.map