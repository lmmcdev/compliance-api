# LMC Compliance API - Project Overview

## Table of Contents
- [Introduction](#introduction)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [HTTP Layer & Middleware](#http-layer--middleware)
- [Infrastructure](#infrastructure)
- [Modules](#modules)
- [Shared Utilities](#shared-utilities)
- [Configuration](#configuration)
- [API Conventions](#api-conventions)
- [Error Handling](#error-handling)
- [Audit Logging](#audit-logging)
- [External Integrations](#external-integrations)

---

## Introduction

The **LMC Compliance API** is a TypeScript-based serverless application running on **Azure Functions**. It provides a comprehensive RESTful API for managing compliance-related data including accounts, addresses, business licenses, healthcare facilities, healthcare providers, license types, locations, and incidents. The API integrates with Azure services for storage, document processing, and external APIs for document classification and extraction.

---

## Technology Stack

- **Runtime**: Node.js with TypeScript (ES2020, NodeNext modules)
- **Platform**: Azure Functions v4
- **Database**: Azure Cosmos DB (NoSQL)
- **Storage**: Azure Blob Storage
- **Validation**: Zod schemas
- **Authentication**: Azure AD with OAuth2 (Client Credentials Flow)
- **External Services**:
  - AIXAAI API (document extraction and classification)
  - Storage Manager API (file management)
  - Zapier Webhooks

---

## Project Structure

```
lmc-compliance-api/
├── src/
│   ├── config/              # Environment configuration
│   ├── functions/           # Azure Function route handlers
│   ├── http/                # HTTP utilities, middleware, error handling
│   ├── infrastructure/      # Database connections (Cosmos DB)
│   ├── modules/             # Domain modules (business logic)
│   │   ├── account/
│   │   ├── address/
│   │   ├── audit-log/
│   │   ├── business-license/
│   │   ├── doc-ai/
│   │   ├── healthcare-facility/
│   │   ├── healthcare-provider/
│   │   ├── incidents/
│   │   ├── license-type/
│   │   ├── location/
│   │   ├── location-type/
│   │   ├── storage-manager/
│   │   └── zapier-webhook/
│   ├── shared/              # Shared utilities and types
│   ├── tests/               # Test files
│   ├── types/               # TypeScript type definitions
│   └── index.ts             # Application entry point
├── dist/                    # Compiled JavaScript output
├── host.json                # Azure Functions host configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Architecture

### Layered Architecture

The application follows a **three-layer architecture**:

1. **Route Layer** (`*.routes.ts`): Azure Function HTTP triggers that handle requests
2. **Service Layer** (`*.service.ts`): Business logic and orchestration
3. **Repository Layer** (`*.repository.ts`): Data access and Cosmos DB interactions

### Module Structure

Each domain module follows a consistent structure:

```
module-name/
├── module-name.doc.ts       # Document interface (database schema)
├── module-name.dto.ts       # Data Transfer Objects and Zod schemas
├── module-name.repository.ts # Data access layer
├── module-name.service.ts   # Business logic layer
├── module-name.routes.ts    # HTTP route handlers
└── index.ts                 # Module exports
```

---

## HTTP Layer & Middleware

### Core HTTP Utilities (`src/http/`)

#### 1. **with-http.ts** - Global Error Handler
```typescript
withHttp(handler: HttpHandler): HttpHandler
```
- Wraps all route handlers
- Catches and maps errors to HTTP responses
- Logs incoming requests

#### 2. **error-map.ts** - Error Mapping
Maps errors to standardized HTTP responses:
- `ZodError` → 422 Validation Error
- `AppError` → Custom status code and error message
- Generic errors → 500 Internal Server Error

#### 3. **app-error.ts** - Custom Error Classes
Provides strongly-typed error classes:
- `AppError` - Base error class
- `ValidationError` (422)
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)

#### 4. **respond.ts** - Response Helpers
Standardized response builders:
- `ok(ctx, data, meta)` - 200 OK
- `created(ctx, data, meta)` - 201 Created
- `noContent(ctx)` - 204 No Content
- `paginated(ctx, pageResult, extra)` - 200 with pagination metadata
- `fail(ctx, status, code, message, details, fields)` - Error response

#### 5. **envelope.ts** - Response Format
All responses follow a standard envelope:
```typescript
// Success
{
  success: true,
  data: T,
  meta: {
    traceId: string,
    pagination?: { page, pageSize, total, totalPages }
  }
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown,
    fields?: Array<{ path, message, code }>
  },
  meta: { traceId: string }
}
```

#### 6. **route-api.ts** - Route Builder
`createPrefixRoute(base, options)` - Creates versioned route helpers:
```typescript
const routes = createPrefixRoute('accounts');
// routes.prefixRoute → 'v1/accounts'
// routes.itemRoute → 'v1/accounts/{id}'
// routes.sub('billing') → 'v1/accounts/billing'
// routes.action('activate') → 'v1/accounts/{id}/activate'
// routes.child('licenses') → { prefix, item, idParamName }
```

#### 7. **request.ts** - Request Parsing
- `parseJson(req, schema)` - Parse and validate JSON body
- `parseQuery(req, schema)` - Parse and validate query parameters
- Auto-normalizes UUIDs to lowercase
- Returns Zod-validated data

#### 8. **normalize.ts** - UUID Normalization
- `normalizeUuidsDeep(obj)` - Recursively normalizes UUID-like strings to lowercase

#### 9. **param.ts** - Route Parameter Extraction
Helper for extracting parameters from Azure Functions routes

#### 10. **status.ts** - HTTP Status Codes
Exports `HTTP_STATUS` enum with standard status codes

---

## Infrastructure

### Cosmos DB (`src/infrastructure/cosmos.ts`)

#### Connection Management
- **Singleton Pattern**: Single Cosmos client instance
- **Lazy Initialization**: Database and containers created on first access
- **Container Auto-Creation**: Containers created if not exists

#### Functions
```typescript
getCosmosClient(): CosmosClient
getDb(): Promise<Database>
getContainer(init: { id, partitionKeyPath }): Promise<Container>
```

#### Partition Strategy
Each module defines its own partition key:
- **Accounts**: `/accountNumber`
- **Healthcare Facilities**: `/accountId`
- **Healthcare Providers**: `/accountId`
- **License Types**: `/id`
- **Incidents**: `/incidentNumber`
- **Addresses**: `/locationTypeId`
- **Locations**: `/locationTypeId`
- **Business Licenses**: `/accountId`
- **Audit Logs**: `/entityType`

---

## Modules

### 1. **Account Module**
Manages user/organization accounts.

**Container**: `accounts` | **Partition Key**: `/accountNumber`

**Features**:
- CRUD operations
- Set/unset billing address (with validation)
- Query filters: `q` (name/number search), `plan`, `payer`
- Token-based pagination (cross-partition queries)

**Routes**:
- `GET /v1/accounts` - List accounts
- `POST /v1/accounts` - Create account
- `GET /v1/accounts/{id}` - Get account
- `PUT /v1/accounts/{id}` - Update account
- `DELETE /v1/accounts/{id}` - Delete account
- `PATCH /v1/accounts/{id}/billing-address` - Set billing address

**Key Fields**: accountNumber (PK), name, type, phone, billingAddressId, payer, plan, etc.

---

### 2. **Address Module**
Manages physical addresses.

**Container**: `addresses` | **Partition Key**: `/locationTypeId`

**Features**:
- CRUD operations
- Partitioned by locationTypeId
- Token-based pagination within partition

**Routes**:
- `GET /v1/addresses` - List addresses
- `POST /v1/addresses` - Create address
- `GET /v1/addresses/{id}` - Get address
- `PUT /v1/addresses/{id}` - Update address
- `DELETE /v1/addresses/{id}` - Delete address

**Key Fields**: street1, street2, city, state, zip, country, locationTypeId (PK)

---

### 3. **Audit Log Module**
Tracks all entity changes for compliance and debugging.

**Container**: `audit-logs` | **Partition Key**: `/entityType`

**Features**:
- Automatic change tracking
- Actor information (user ID, email, name, IP)
- Request context (traceId, method, path, status, userAgent)
- Detailed change diffs (before/after)
- Safe logging (never throws errors)

**Routes**:
- `GET /v1/audit-logs` - List audit logs (query by entityType, entityId, action, actor, dateRange)

**Helpers** (`audit-helpers.ts`):
- `actorFromReq(req)` - Extract user info from headers
- `contextFromReq(req, status)` - Extract request context
- `shallowDiff(before, after, keys)` - Compute changes
- `safeAuditLog({ entityType, entityId, action, ... })` - Safe wrapper for logging

**Key Fields**: entityType (PK), entityId, action, actor, context, changes[], before, after, timestamp

---

### 4. **Business License Module**
Manages business licenses for accounts.

**Container**: `business-licenses` | **Partition Key**: `/accountId`

**Features**:
- CRUD operations
- Partitioned by accountId
- Query filters: license number, status, expiration date

**Routes**:
- `GET /v1/business-licenses` - List licenses
- `POST /v1/business-licenses` - Create license
- `GET /v1/business-licenses/{id}` - Get license
- `PUT /v1/business-licenses/{id}` - Update license
- `DELETE /v1/business-licenses/{id}` - Delete license

**Key Fields**: accountId (PK), licenseNumber, issueDate, expirationDate, status

---

### 5. **Doc AI Module**
Integration with AIXAAI API for document classification and extraction.

**Service**: `DocAiService` (no database)

**Features**:
- Document classification (identify document type)
- Document extraction (extract fields from documents)
- Azure AD authentication with token caching
- Model mapping between classification types and extraction models

**Routes**:
- `POST /v1/doc-ai/classify` - Classify document by blobName
- `POST /v1/doc-ai/extract` - Extract data from document

**Key Components**:
- `AccessTokenManager` - Manages Azure AD tokens with caching
- Model mapping utility (`model-mapping.util.ts`)
- Supported document types: AHCA, Biomedical Waste, Business Tax License, Certificate of Use, CLIA, DEA, Elevators, Fire Permit, HCCE, Professional License, Radiation Permit

**Request Format**:
```typescript
// Classification
{ blobName: string }

// Extraction
{ blobName: string, modelId?: string, options?: object }
```

**Response Format**:
```typescript
{
  result: T | null,
  analyzeResult: {
    modelId?: string,
    apiVersion?: string,
    documentsCount?: number
  },
  timestamp: string
}
```

---

### 6. **Healthcare Facility Module**
Manages healthcare facilities (hospitals, clinics, etc.).

**Container**: `healthcare-facilities` | **Partition Key**: `/accountId`

**Features**:
- CRUD operations
- Partitioned by accountId
- Query filters: `q` (name search), `addressId`, sorting
- Token-based pagination within partition

**Routes**:
- `GET /v1/healthcare-facilities` - List facilities
- `POST /v1/healthcare-facilities` - Create facility
- `GET /v1/healthcare-facilities/{id}` - Get facility
- `PUT /v1/healthcare-facilities/{id}` - Update facility
- `DELETE /v1/healthcare-facilities/{id}` - Delete facility

**Key Fields**: accountId (PK), name, type, addressId, phone, email, status

---

### 7. **Healthcare Provider Module**
Manages healthcare providers (doctors, nurses, etc.).

**Container**: `healthcare-providers` | **Partition Key**: `/accountId`

**Features**:
- CRUD operations
- Partitioned by accountId
- Query filters: `q` (name search), `npi`, `status`, `facilityId`, `pcp`, `attendingPhysician`, `inHouse`, sorting
- Token-based pagination within partition

**Routes**:
- `GET /v1/healthcare-providers` - List providers
- `POST /v1/healthcare-providers` - Create provider
- `GET /v1/healthcare-providers/{id}` - Get provider
- `PUT /v1/healthcare-providers/{id}` - Update provider
- `DELETE /v1/healthcare-providers/{id}` - Delete provider

**Key Fields**: accountId (PK), name, npi, status, facilityId, pcp, attendingPhysician, inHouse

---

### 8. **Incidents Module**
Manages compliance and IT incidents.

**Container**: `incidents` | **Partition Key**: `/incidentNumber`

**Features**:
- CRUD operations
- Supports two incident types: `compliance_incident` and `it_incident`
- Query filters: doc_type, Ticket_priority, Activity_status, Ticket_type, severity, status, assignedTo
- Sorting by createdAt, updatedAt, Ticket_resolved_Date, reportedAt
- Token-based pagination (cross-partition queries)

**Routes**:
- `GET /v1/incidents` - List incidents
- `POST /v1/incidents` - Create incident
- `GET /v1/incidents/{id}` - Get incident
- `PUT /v1/incidents/{id}` - Update incident
- `DELETE /v1/incidents/{id}` - Delete incident

**Key Fields**:
- Common: incidentNumber (PK), doc_type
- IT Incident: Ticket_priority, Activity_status, Ticket_type, Ticket_resolved_Date
- Compliance Incident: severity, status, assignedTo, reportedAt

---

### 9. **License Type Module**
Manages types of licenses (master data).

**Container**: `license-types` | **Partition Key**: `/id`

**Features**:
- CRUD operations
- Unique code constraint
- File upload support to Azure Blob Storage
- Offset-based pagination

**Routes**:
- `GET /v1/license-types` - List license types
- `POST /v1/license-types` - Create license type
- `GET /v1/license-types/{id}` - Get license type
- `GET /v1/license-types/code/{code}` - Get by code
- `PUT /v1/license-types/{id}` - Update license type
- `DELETE /v1/license-types/{id}` - Delete license type
- `POST /v1/license-types/upload` - Upload license file to blob storage

**Key Fields**: id (PK), code (unique), displayName, description

**Upload Service**: `LicenseTypeUploadService` - Uploads files to `compliance/licenses` container in Azure Blob Storage

---

### 10. **Location Module**
Manages locations (sites, branches, etc.).

**Container**: `locations` | **Partition Key**: `/locationTypeId`

**Features**:
- CRUD operations
- Partitioned by locationTypeId
- Query filters: `q` (name search), sorting
- Token-based pagination within partition

**Routes**:
- `GET /v1/locations` - List locations
- `POST /v1/locations` - Create location
- `GET /v1/locations/{id}` - Get location
- `PUT /v1/locations/{id}` - Update location
- `DELETE /v1/locations/{id}` - Delete location

**Key Fields**: locationTypeId (PK), name, description, addressId

---

### 11. **Location Type Module**
Manages location types (master data).

**Container**: `location-types` | **Partition Key**: `/id`

**Features**:
- CRUD operations
- Unique code constraint
- Offset-based pagination

**Routes**:
- `GET /v1/location-types` - List location types
- `POST /v1/location-types` - Create location type
- `GET /v1/location-types/{id}` - Get location type
- `GET /v1/location-types/code/{code}` - Get by code
- `PUT /v1/location-types/{id}` - Update location type
- `DELETE /v1/location-types/{id}` - Delete location type

**Key Fields**: id (PK), code (unique), displayName, description

---

### 12. **Storage Manager Module**
Integration with Storage Manager API for file operations.

**Service**: `StorageService` (no database)

**Features**:
- Upload files to Azure Blob Storage via API
- Get file metadata
- Delete files
- List files in container
- Azure AD authentication with token caching

**Routes**:
- `POST /v1/storage/upload` - Upload file
- `GET /v1/storage/files/{container}/{blobName}` - Get file
- `DELETE /v1/storage/files/{container}/{blobName}` - Delete file
- `GET /v1/storage/files/list` - List files

**Key Components**:
- Uses `AccessTokenManager` for Azure AD tokens
- Validates responses with Zod schemas
- Supports multipart/form-data uploads

---

### 13. **Zapier Webhook Module**
Receives and processes webhooks from Zapier.

**Service**: `ZapierWebhookService` (no database)

**Features**:
- Receives arbitrary webhook data
- Logs incoming requests
- Returns success/failure response

**Routes**:
- `POST /v1/zapier/webhook` - Receive webhook

**Response Format**:
```typescript
{
  success: boolean,
  message: string,
  receivedAt: string,
  data?: unknown
}
```

---

## Shared Utilities

### 1. **versioned-router.ts**
```typescript
versionedRoute(path, version, opts): string
```
- Generates versioned routes (e.g., `v1/accounts`)
- Supports optional `/api` prefix
- Used by `createPrefixRoute`

### 2. **validation.ts**
```typescript
uuidLoose: z.string().regex(...)
uuidLooseNormalized: z.string().transform(...).pipe(uuidLoose)
```
- UUID validation schemas
- Case-insensitive UUID normalization

### 3. **base.doc.ts**
```typescript
interface BaseDoc {
  id: string;
  createdAt: string;
  updatedAt: string;
}
```
- Base interface for all Cosmos DB documents

### 4. **types.ts**
```typescript
type Id = string;
type PageResult<T> = { items, total, page, pageSize };
interface ListQuery { page?, pageSize? };
```
- Common type definitions

### 5. **access-token-manager.ts**
```typescript
class AccessTokenManager {
  async getAccessToken(config: AzureAdConfig): Promise<TokenResponse>
  clearCache(config?: AzureAdConfig): void
}
```
- Manages Azure AD OAuth2 tokens
- Token caching with 5-minute buffer
- Singleton instance exported as `tokenManager`

### 6. **model-mapping.util.ts**
Maps document classification types to extraction model IDs:
```typescript
getModelIdForDocType(classificationDocType): string | null
getAllClassificationTypes(): string[]
getAllModelIds(): string[]
hasModelMapping(classificationDocType): boolean
getDocTypeForModelId(modelId): string | null
```

---

## Configuration

### Environment Variables (`src/config/env.ts`)

**Application**:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 7071)
- `APP_NAME`, `APP_VERSION`, `APP_BUILD`, `APP_COMMIT` - App metadata
- `API_VERSION` - API version prefix (default: v1)

**Cosmos DB**:
- `COSMOS_ENDPOINT` - Cosmos DB endpoint URL
- `COSMOS_KEY` - Cosmos DB access key
- `COSMOS_DB_NAME` - Database name

**Azure Blob Storage**:
- `AZURE_BLOB_CONNECTION_STRING` - Connection string for blob storage

**Azure AD (AIXAAI API)**:
- `AZURE_TENANT_ID` - Azure AD tenant ID
- `AZURE_AIXAAI_CLIENT_ID` - Client ID for AIXAAI API
- `AZURE_AIXAAI_CLIENT_SECRET` - Client secret for AIXAAI API
- `AIXAAI_API_SCOPE` - OAuth scope for AIXAAI API

**AIXAAI API**:
- `AIXAAI_EXTRACTION_API_URL` - Document extraction endpoint
- `AIXAAI_CLASSIFICATION_API_URL` - Document classification endpoint

**Storage Manager API**:
- `STORAGE_MANAGER_API_URL` - Storage Manager base URL
- `AZURE_MGR_CLIENT_ID` - Client ID for Storage Manager
- `AZURE_MGR_CLIENT_SECRET` - Client secret for Storage Manager
- `AZURE_MGR_API_SCOPE` - OAuth scope for Storage Manager

**Paths**:
- `TEMP_PATH` - Temporary file path (default: /tmp)
- `COMPLIANCE_PATH` - Compliance file path (default: /compliance)

---

## API Conventions

### Versioning
All routes are prefixed with `/v1` (configurable via `API_VERSION`)

### Request Format
- **JSON Body**: All POST/PUT/PATCH requests use JSON
- **Query Parameters**: For GET requests (pagination, filters)
- **Route Parameters**: For resource IDs (e.g., `/accounts/{id}`)

### Response Format
See [envelope.ts](#5-envelopets---response-format)

### Pagination
Two pagination strategies:

1. **Token-based** (Cosmos DB continuation token):
   - Used for cross-partition queries or partition-scoped queries
   - Query params: `pageSize`, `token`
   - Response includes `continuationToken`

2. **Offset-based** (traditional):
   - Used for master data (license-types, location-types)
   - Query params: `page`, `pageSize`
   - Response includes `pagination: { page, pageSize, total, totalPages }`

### Filtering
Modules support various filters:
- `q` - Text search (name, number, etc.)
- Entity-specific filters (e.g., `status`, `plan`, `payer`)
- Date range filters
- Boolean flags

### Sorting
Some modules support sorting:
- Query params: `sort`, `order` (ASC/DESC)
- Example: `?sort=createdAt&order=DESC`

### UUID Normalization
All UUIDs are automatically normalized to lowercase before validation

---

## Error Handling

### Error Flow
1. Route handler throws error
2. `withHttp` middleware catches error
3. `mapErrorToResponse` maps error to HTTP response
4. Standardized error envelope returned to client

### Error Types
- **Validation Errors** (422): Zod validation failures
- **Not Found** (404): Resource not found
- **Conflict** (409): Unique constraint violations
- **Bad Request** (400): Malformed requests
- **Unauthorized** (401): Authentication failures
- **Forbidden** (403): Authorization failures
- **Internal Server Error** (500): Unexpected errors

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {...},
    "fields": [
      { "path": "email", "message": "Invalid email", "code": "invalid_string" }
    ]
  },
  "meta": {
    "traceId": "abc-123-def"
  }
}
```

---

## Audit Logging

All entity changes can be tracked using the audit log module:

```typescript
await safeAuditLog({
  entityType: 'account',
  entityId: account.id,
  action: 'create' | 'update' | 'delete' | 'read',
  req: httpRequest,
  status: 200,
  changes: [{ path: 'name', from: 'old', to: 'new' }],
  before: {...},
  after: {...},
  message: 'Optional message'
});
```

**Features**:
- Never throws errors (safe wrapper)
- Captures user information from headers
- Tracks request context (trace ID, method, path, status)
- Computes detailed change diffs
- Queryable by entity type, ID, action, actor, date range

---

## External Integrations

### 1. AIXAAI API
**Purpose**: Document classification and extraction

**Authentication**: Azure AD OAuth2 (Client Credentials)

**Operations**:
- Classify document → Returns document type and confidence
- Extract data → Returns structured data from document

**Configuration**: See [Azure AD (AIXAAI API)](#environment-variables-srcconfigenvts)

### 2. Storage Manager API
**Purpose**: File storage and management

**Authentication**: Azure AD OAuth2 (Client Credentials)

**Operations**:
- Upload file → Returns blob name and URL
- Get file metadata → Returns file info
- Delete file → Removes file from storage
- List files → Returns files in container

**Configuration**: See [Storage Manager API](#environment-variables-srcconfigenvts)

### 3. Zapier Webhooks
**Purpose**: Integration with Zapier workflows

**Authentication**: None (public endpoint, add security as needed)

**Operations**:
- Receive webhook → Logs and processes arbitrary data

---

## API Design Patterns

### Factory Pattern
Services use static factory methods for initialization:
```typescript
const service = await AccountService.createInstance();
```
This ensures repositories are initialized before use.

### Repository Pattern
All data access goes through repositories:
```typescript
class AccountRepository {
  async init(): Promise<this>
  async create(data): Promise<AccountDoc>
  async findById(id, pk): Promise<AccountDoc | null>
  async list(opts): Promise<{ items, continuationToken }>
  async update(id, pk, patch): Promise<AccountDoc>
  async delete(id, pk): Promise<void>
}
```

### Service Layer Pattern
Business logic isolated in services:
```typescript
class AccountService {
  async create(payload): Promise<AccountDoc>
  async get(id, accountNumber): Promise<AccountDoc>
  async list(opts): Promise<{ items, continuationToken }>
  async update(id, accountNumber, patch): Promise<AccountDoc>
  async remove(id, accountNumber): Promise<void>
  async setBillingAddress(accountId, accountNumber, addressId): Promise<AccountDoc>
}
```

### Route Handler Pattern
All routes follow consistent structure:
```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { withHttp, ok, created, parseJson, parseQuery } from '../../http';
import { Service } from './service';

async function listHandler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const query = await parseQuery(req, ListSchema);
  const service = await Service.createInstance();
  const result = await service.list(query);
  return ok(ctx, result);
}

app.http('listItems', {
  methods: ['GET'],
  route: 'v1/items',
  handler: withHttp(listHandler),
});
```

---

## Development Workflow

### Build
```bash
npm run build        # Compile TypeScript
npm run watch        # Watch mode
npm run clean        # Remove dist/
```

### Run Locally
```bash
npm run prestart     # Clean + build
npm start            # Start Azure Functions (port 7072)
```

### Testing
```bash
npm test             # Run tests (currently placeholder)
```

### Postman Collection
Import `Compliance API v1.postman_collection.json` for API testing

---

## Security Considerations

### Authentication
- Azure Functions can be secured with function keys or Azure AD
- External API calls use OAuth2 Client Credentials flow
- Tokens are cached with 5-minute expiry buffer

### Data Validation
- All input validated with Zod schemas
- UUID normalization prevents case-sensitivity issues
- SQL injection prevented by using parameterized Cosmos queries

### Error Messages
- Production errors hide internal details
- Stack traces not exposed to clients
- All errors logged with trace IDs

### Headers
The API expects these headers for audit logging:
- `x-user-id` - User ID
- `x-user-email` - User email
- `x-user-name` - User name
- `x-forwarded-for` - Client IP
- `x-request-id` - Request ID
- `x-trace-id` - Trace ID

---

## Deployment

### Azure Functions Deployment
1. Ensure environment variables are set in Azure portal
2. Build the project: `npm run build`
3. Deploy using Azure Functions Core Tools or CI/CD pipeline

### Database Setup
- Cosmos DB containers are auto-created on first access
- Partition keys are defined per module (see [Infrastructure](#infrastructure))

### Storage Setup
- Azure Blob Storage containers must be created manually or via API
- Connection string must be set in environment variables

---

## Monitoring & Logging

### Logging Levels
Configured in `host.json`:
- Default: Information
- Host.Results: Information
- Function: Information

### Trace IDs
Every request gets a unique trace ID (from `ctx.invocationId`)
Included in all responses and logs for correlation

### Audit Logs
All entity changes can be tracked in `audit-logs` container
Query by entity type, ID, action, actor, or date range

---

## Future Enhancements

- Add authentication/authorization middleware
- Implement rate limiting
- Add comprehensive unit and integration tests
- Add API documentation (Swagger/OpenAPI)
- Implement soft deletes for all entities
- Add bulk operations support
- Implement webhooks for entity changes
- Add full-text search with Azure Cognitive Search

---

## License
MIT

---

## Contact & Support
For questions or issues, please contact the development team.