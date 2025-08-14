"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionedRoute = void 0;
const env_1 = require("../config/env");
const versionedRoute = (path, version = env_1.env.API_VERSION) => {
    if (!path)
        throw new Error('Path is required');
    return `${version}/${path}`;
};
exports.versionedRoute = versionedRoute;
//# sourceMappingURL=versioned-route.helper.js.map