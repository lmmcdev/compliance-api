import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Location } from '../entities/location';
import { Center } from '../entities/center';
import { HealthcareProvider } from '../entities/healthcareProvider';
import { License } from '../entities/license';
import { ENV } from './env';

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_ENCRYPT } = ENV;

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false, // Always false in Functions; use migrations
  logging: false,
  entities: ['src/entities/*.ts'],
  migrations: ['src/migrations/*.ts'],
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
