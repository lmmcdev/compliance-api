import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { LicenseType } from '../modules/license-type';
import { LocationType } from '../modules/location-type';
import { Address } from '../modules/address';
import { HealthcareFacility } from '../modules/healthcare-facility';
import { HealthcareProvider } from '../modules/healthcare-provider';
import { BusinessLicense } from '../modules/business-license';
import { Account } from '../modules/account/account.entity';
import { Location } from '../modules/location';

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
    Location,
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
