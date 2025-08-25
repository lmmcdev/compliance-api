// src/infra/cosmos.ts
import { CosmosClient, Database, Container, ContainerRequest } from '@azure/cosmos';

let client: CosmosClient | null = null;
let database: Database | null = null;

export function getCosmosClient(): CosmosClient {
  if (!client) {
    client = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!,
    });
  }
  return client;
}

export async function getDb(): Promise<Database> {
  if (!database) {
    const c = getCosmosClient();
    const { database: db } = await c.databases.createIfNotExists({
      id: process.env.COSMOS_DB_NAME!,
    });
    database = db;
  }
  return database!;
}

export async function getContainer(id: string, partitionKeyPath = '/id'): Promise<Container> {
  const db = await getDb();

  const containerReq: ContainerRequest = {
    id,
    partitionKey: { paths: [partitionKeyPath] },
  };
  const { container } = await db.containers.createIfNotExists(containerReq);
  return container;
}
