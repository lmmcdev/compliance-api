"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: parseInt(process.env.PORT ?? '7071', 10),
    APP_NAME: process.env.APP_NAME ?? 'lmc-compliance-api',
    APP_VERSION: process.env.APP_VERSION ?? '1.0.0',
    APP_BUILD: process.env.APP_BUILD ?? 'latest',
    APP_COMMIT: process.env.APP_COMMIT ?? 'unknown',
    APP_TIMESTAMP: new Date().toISOString(),
    API_VERSION: process.env.API_VERSION ?? 'v1',
    // DB SQL azure
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT ?? '1433', 10),
    DB_USER: process.env.DB_USER ?? 'sa',
    DB_PASS: process.env.DB_PASS ?? 'LMMC0okm9ijn!@',
    DB_NAME: process.env.DB_NAME ?? 'compliance-db',
    DB_ENCRYPT: process.env.DB_ENCRYPT ?? 'true', // Azure SQL requires encryption
};
exports.default = exports.env;
//# sourceMappingURL=env.js.map