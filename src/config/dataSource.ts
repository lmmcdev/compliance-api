import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Location } from '../entities/location';
import { Center } from '../entities/center';
import { HealthcareProvider } from '../entities/healthcareProvider';
import { License } from '../entities/license';

const {
  DB_HOST,
  DB_PORT = '1433',
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_ENCRYPT = 'true', // Azure SQL requires encryption
} = process.env;

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  synchronize: false,       // Always false in Functions; use migrations
  logging: false,
  entities: [Location, Center, HealthcareProvider, License],
  migrations: ['src/migrations/*.ts'],
  options: {
    encrypt: DB_ENCRYPT === 'true',
    trustServerCertificate: false,
  },
  extra: {
    // conservative pool for serverless
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
});
