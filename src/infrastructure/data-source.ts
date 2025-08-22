import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { LicenseType } from '../modules/license-type';
import { LocationType } from '../modules/location-type';
import { Address } from '../modules/address';
import { HealthcareProvider } from '../modules/healthcare-provider';
import { HealthcareFacility } from '../modules/healthcare-facility';
import { BusinessLicense } from '../modules/business-license';
import { Account } from '../modules/account';
import { Location } from '../modules/location';

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_ENCRYPT } = env;

const AppDataSource = new DataSource({
  type: 'mssql',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false,
  logging: ['error'],
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
  migrations: [],
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

export default AppDataSource;
