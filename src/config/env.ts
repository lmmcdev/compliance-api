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

  // DB Cosmos
  COSMOS_ENDPOINT: process.env.COSMOS_ENDPOINT,
  COSMOS_KEY: process.env.COSMOS_KEY,
  COSMOS_DB_NAME: process.env.COSMOS_DB_NAME,
  // Azure Blob Storage
  AZURE_BLOB_CONNECTION_STRING: process.env.AZURE_BLOB_CONNECTION_STRING,

  // Azure AD Configuration
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
  AZURE_AIXAAI_CLIENT_ID: process.env.AZURE_AIXAAI_CLIENT_ID,
  AZURE_AIXAAI_CLIENT_SECRET: process.env.AZURE_AIXAAI_CLIENT_SECRET,

  // AIXAAI API Configuration
  AIXAAI_API_SCOPE: process.env.AIXAAI_API_SCOPE,
  AIXAAI_EXTRACTION_API_URL: process.env.AIXAAI_EXTRACTION_API_URL,
  AIXAAI_CLASSIFICATION_API_URL: process.env.AIXAAI_CLASSIFICATION_API_URL,
  AIXAAI_OPENAI_QUERY_API_URL: process.env.AIXAAI_OPENAI_QUERY_API_URL,
  AIXXAAI_COGNITIVE_SEARCH_API_URL: process.env.AIXXAAI_COGNITIVE_SEARCH_API_URL,

  // storage-manager Configuration
  STORAGE_MANAGER_API_URL: `${process.env.STORAGE_MANAGER_API_URL}/api`,

  // paths
  TEMP_PATH: process.env.TEMP_PATH || '/tmp',
  COMPLIANCE_PATH: process.env.COMPLIANCE_PATH || '/compliance',

  // Azure AD for storage-manager
  AZURE_MGR_CLIENT_ID: process.env.AZURE_MGR_CLIENT_ID,
  AZURE_MGR_CLIENT_SECRET: process.env.AZURE_MGR_CLIENT_SECRET,
  AZURE_MGR_API_SCOPE: process.env.AZURE_MGR_API_SCOPE,

  // Atera Logic App Configuration
  ATERA_LOGIC_APP_URL: process.env.ATERA_LOGIC_APP_URL,

  // Azure Cognitive Search Configuration
  COGNITIVE_SEARCH_ENDPOINT: process.env.COGNITIVE_SEARCH_ENDPOINT,
  COGNITIVE_SEARCH_KEY: process.env.COGNITIVE_SEARCH_KEY,
  COGNITIVE_SEARCH_WINPATCH_INDEX_NAME: process.env.COGNITIVE_SEARCH_WINPATCH_INDEX_NAME ?? 'summary-windows-patch',
};

export default env;
