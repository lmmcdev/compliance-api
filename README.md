# Compliance API

This project is a TypeScript-based RESTful API for managing compliance-related entities such as accounts, addresses, business licenses, healthcare facilities, healthcare providers, license types, locations, and location types. It is designed to run on Azure Functions and uses TypeORM for data access.

## Features
- Modular structure for different domain entities
- CRUD operations for all major resources
- Pagination and query support
- Data validation using Zod schemas
- Azure Functions HTTP triggers
- TypeORM integration for database access

## Project Structure
```
src/
  config/           # Environment configuration
  functions/        # HTTP route helpers and error handling
  infrastructure/   # Data source and TypeORM setup
  migrations/       # Database migrations
  modules/          # Domain modules (account, address, business-license, etc.)
    <entity>/       # Each entity has DTOs, service, repository, routes, etc.
  shared/           # Shared base classes and types
  types/            # Type definitions
```

## Main Modules
- **Account**: Manage user accounts and billing addresses
- **Address**: CRUD for address entities
- **Business License**: Manage business licenses and their statuses
- **Healthcare Facility/Provider**: Manage healthcare-related entities
- **License Type**: Manage types of licenses
- **Location/Location Type**: Manage locations and their types

## API Endpoints
All endpoints are versioned and follow RESTful conventions. Example routes:
- `GET /accounts` - List accounts
- `POST /accounts` - Create account
- `GET /accounts/{id}` - Get account by ID
- `PATCH /accounts/{id}/billing-address` - Set/unset billing address
- Similar CRUD endpoints for addresses, business licenses, healthcare facilities/providers, license types, locations, and location types

## Getting Started
1. **Install dependencies**
   ```zsh
   npm install
   ```
2. **Build the project**
   ```zsh
   npm run build
   ```
3. **Run locally (Azure Functions)**
   ```zsh
   npm run watch
   func host start
   ```

## Testing
- Tests are located in `src/tests/`
- Run tests with your preferred test runner (e.g., Jest)

## Environment Configuration
- Edit `src/config/env.ts` for environment variables
- Database configuration is managed in `src/infrastructure/data-source.ts`

## Migrations
- Migration files are in `src/migrations/`
- Use TypeORM CLI for running migrations

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
