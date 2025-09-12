// src/modules/address/address.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { AddressDoc } from './address.doc';
import { randomUUID } from 'crypto';

const CONTAINER_ID = 'addresses';
const PK_PATH = '/locationTypeId';

export class AddressRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(data: Omit<AddressDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<AddressDoc> {
    try {
      const now = new Date().toISOString();
      const document: AddressDoc = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...data,
        // normalization examples (optional)
        state: data.state,
        country: data.country,
        zip: String(data.zip),
      };
      console.log(`[address.repository] Creating address: ${JSON.stringify(document)}`);
      const { resource } = await this.container.items.create(document);
      console.log(`[address.repository] Created address: ${JSON.stringify(resource)}`);
      return resource as AddressDoc;
    } catch (error) {
      console.error(`[address.repository] Error creating address: ${error}`);
      throw error;
    }
  }

  // Point read: you MUST provide the partition key (locationTypeId)
  async findById(id: string, locationTypeId: string): Promise<AddressDoc | null> {
    try {
      const { resource } = await this.container.item(id, locationTypeId).read<AddressDoc>();
      return resource ? (resource as AddressDoc) : null;
    } catch {
      return null;
    }
  }

  async listByLocationType(
    locationTypeId: string,
    opts?: { pageSize?: number; token?: string; q?: string; addressType?: string },
  ) {
    const { pageSize = 50, token, q, addressType } = opts ?? {};

    const filters: string[] = ['c.locationTypeId = @lt'];
    const params: { name: string; value: any }[] = [{ name: '@lt', value: locationTypeId }];

    if (q) {
      filters.push(
        '(CONTAINS(LOWER(c.street), @q) OR CONTAINS(LOWER(c.city), @q) OR CONTAINS(LOWER(c.county), @q))',
      );
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (addressType) {
      filters.push('c.addressType = @addressType');
      params.push({ name: '@addressType', value: addressType });
    }

    const query: SqlQuerySpec = {
      query: `SELECT c.id, c.street, c.city, c.state, c.zip, c.country, c.county,
                     c.addressType, c.drivingDirections, c.description, c.timeZone, c.lead,
                     c.locationTypeId, c.createdAt, c.updatedAt
              FROM c
              WHERE ${filters.join(' AND ')}
              ORDER BY c.createdAt DESC`,
      parameters: params,
    };

    const iter = this.container.items.query<AddressDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
      // stays in one partition because we filtered by locationTypeId (the PK)
    });

    const { resources, continuationToken } = await iter.fetchNext();
    return {
      items: resources.map((item) => item as AddressDoc),
      continuationToken: continuationToken ?? null,
    };
  }

  async update(
    id: string,
    locationTypeId: string,
    patch: Partial<Omit<AddressDoc, 'id' | 'createdAt' | 'locationTypeId'>>,
  ): Promise<AddressDoc | null> {
    const current = await this.findById(id, locationTypeId);
    if (!current) return null;

    const updated: AddressDoc = {
      ...current,
      ...patch,
      // keep normalization consistent if state/country/zip are changing
      ...(patch.state !== undefined ? { state: patch.state.toUpperCase() } : {}),
      ...(patch.country !== undefined ? { country: patch.country.toUpperCase() } : {}),
      ...(patch.zip !== undefined ? { zip: String(patch.zip) } : {}),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, locationTypeId).replace(updated);
    return resource as AddressDoc;
  }

  async delete(id: string, locationTypeId: string): Promise<void> {
    await this.container.item(id, locationTypeId).delete();
  }

  async resolveLocationTypeId(id: string): Promise<string | null> {
    const spec: SqlQuerySpec = {
      query:
        'SELECT TOP 1 VALUE c.locationTypeId FROM c WHERE c.id = @id AND (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted != true)',
      parameters: [{ name: '@id', value: id }],
    };
    const { resources } = await this.container.items.query<string>(spec).fetchAll();
    return resources[0] ?? null;
  }
}
