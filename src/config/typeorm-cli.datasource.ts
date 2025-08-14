// src/config/typeorm-cli.datasource.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';

// 👉 Import your entities (keep this in sync with runtime DS)
import { LicenseType } from '../entities/license-type.entity';
import { LocationType } from '../entities/location-type.entity';
// import { AuditLog } from '../entities/audit-log.entity';

export default new DataSource({
  type: 'mssql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [
    LicenseType,
    LocationType,
    // AuditLog,
  ],
  // CLI uses TS migrations
  migrations: ['src/migrations/*.ts'],
  options: {
    encrypt: env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
});
