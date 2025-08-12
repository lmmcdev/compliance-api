"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/typeorm-cli.datasource.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./env");
// 👉 Import your entities (keep this in sync with runtime DS)
const license_type_entity_1 = require("../entities/license-type.entity");
const location_type_entity_1 = require("../entities/location-type.entity");
// import { AuditLog } from '../entities/audit-log.entity';
exports.default = new typeorm_1.DataSource({
    type: 'mssql',
    host: env_1.env.DB_HOST,
    port: env_1.env.DB_PORT,
    username: env_1.env.DB_USER,
    password: env_1.env.DB_PASS,
    database: env_1.env.DB_NAME,
    synchronize: false,
    logging: true,
    entities: [
        license_type_entity_1.LicenseType,
        location_type_entity_1.LocationType,
        // AuditLog,
    ],
    // CLI uses TS migrations
    migrations: ['src/migrations/*.ts'],
    options: {
        encrypt: env_1.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
});
//# sourceMappingURL=typeorm-cli.datasource.js.map