import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { LicenseType } from '../entities/license-type.entity';
import { join } from 'path';
import { LocationType } from '../entities/location-type.entity';

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
  entities: [LicenseType, LocationType],
  migrations: [join(__dirname, '..', 'migrations', '*.{js,cjs}')],
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
