"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("./env");
const license_type_entity_1 = require("../entities/license-type.entity");
const path_1 = require("path");
const location_type_entity_1 = require("../entities/location-type.entity");
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_ENCRYPT } = env_1.env;
const AppDataSource = new typeorm_1.DataSource({
    type: 'mssql',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    synchronize: false,
    logging: ['query', 'error'],
    entities: [license_type_entity_1.LicenseType, location_type_entity_1.LocationType],
    migrations: [(0, path_1.join)(__dirname, '..', 'migrations', '*.{js,cjs}')],
    options: {
        encrypt: DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
    extra: {
        pool: {
            max: 5,
            min: 0,
            idleTimeoutMillis: 30000,
        },
    },
});
exports.default = AppDataSource;
//# sourceMappingURL=data-source.js.map