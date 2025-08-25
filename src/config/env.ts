import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '7071', 10),
  APP_NAME: process.env.APP_NAME ?? 'lmc-compliance-api',
  APP_VERSION: process.env.APP_VERSION ?? '1.0.0',
  APP_BUILD: process.env.APP_BUILD ?? 'latest',
  APP_COMMIT: process.env.APP_COMMIT ?? 'unknown',
  APP_TIMESTAMP: new Date().toISOString(),
  API_VERSION: process.env.API_VERSION ?? 'v1',

  // DB SQL azure
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT ?? '1433', 10),
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  DB_ENCRYPT: process.env.DB_ENCRYPT,

  // DB Cosmos
  COSMOS_ENDPOINT: process.env.COSMOS_ENDPOINT,
  COSMOS_KEY: process.env.COSMOS_KEY,
  COSMOS_DB_NAME: process.env.COSMOS_DB_NAME,
};

export default env;
