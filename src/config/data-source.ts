import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { join } from 'path';

import { env } from './env';
import { LicenseType } from '../entities/license-type.entity';
import { LocationType } from '../entities/location-type.entity';
import { Address } from '../entities/address.entity';
import { HealthcareProvider } from '../entities/healthcare-provider.entity';
import { HealthcareFacility } from '../entities/healthcare-facility.entity';
import { BusinessLicense } from '../entities/business-license.entity';
import { Account } from '../entities/account.entity';

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_ENCRYPT } = env;

const AppDataSource = new DataSource({
  type: 'mssql',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false,
  logging: ['query', 'error'],
  entities: [
    LicenseType,
    LocationType,
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
