// src/config/typeorm-cli.datasource.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';

// 👉 Import your entities (keep this in sync with runtime DS)
import { LicenseType } from '../entities/license-type.entity';
import { LocationType } from '../entities/location-type.entity';
import { Address } from '../entities/address.entity';
import { HealthcareFacility } from '../entities/healthcare-facility.entity';
import { HealthcareProvider } from '../entities/healthcare-provider.entity';
import { BusinessLicense } from '../entities/business-license.entity';
import { Account } from '../entities/account.entity';

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
    Address,
    HealthcareFacility,
    HealthcareProvider,
    BusinessLicense,
    Account,
  ],

  migrations: ['src/migrations/*.ts'],
  options: {
    encrypt: env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
});
