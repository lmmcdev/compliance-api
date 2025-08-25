// src/modules/location-type/location-type.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { LocationTypeDoc } from './location-type.doc';
import { randomUUID } from 'crypto';

const CONTAINER_ID = 'location_types';
const PK_PATH = '/id'; // If you prefer PK by code: set '/code' and use id = code

export class LocationTypeRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(
    data: Omit<LocationTypeDoc, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LocationTypeDoc> {
    if (!data.code) throw new Error('code is required');

    // normalize to uppercase to ensure uniqueness and cheap queries
    const code = data.code.trim().toUpperCase();
    const exists = await this.findByCode(code);
    if (exists) throw new Error(`LocationType with code "${code}" already exists`);

    const now = new Date().toISOString();
    const doc: LocationTypeDoc = {
      id: randomUUID(), // or use code if PK = '/code'
      code,
      displayName: data.displayName ?? null,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as LocationTypeDoc;
  }

  async findById(id: string): Promise<LocationTypeDoc | null> {
    try {
      const pk = PK_PATH === '/id' ? id : id;
      const { resource } = await this.container.item(id, pk).read<LocationTypeDoc>();
      return resource as LocationTypeDoc;
    } catch {
      return null;
    }
  }

  // Query without UPPER() because we normalize on write
  async findByCode(code: string): Promise<LocationTypeDoc | null> {
    const query: SqlQuerySpec = {
      query: 'SELECT TOP 1 * FROM c WHERE c.code = @code',
      parameters: [{ name: '@code', value: code.trim().toUpperCase() }],
    };
    const { resources } = await this.container.items.query<LocationTypeDoc>(query).fetchAll();
    if (resources.length === 0) return null;
    return resources[0] as LocationTypeDoc;
  }

  async update(
    id: string,
    patch: Partial<Pick<LocationTypeDoc, 'code' | 'displayName' | 'description'>>,
  ): Promise<LocationTypeDoc | null> {
    const current = await this.findById(id);
    if (!current) return null;

    let nextCode = current.code;
    if (patch.code !== undefined) {
      nextCode = patch.code.trim().toUpperCase();
      if (nextCode !== current.code) {
        const clash = await this.findByCode(nextCode);
        if (clash) throw new Error(`LocationType with code "${nextCode}" already exists`);
      }
    }

    const updated: LocationTypeDoc = {
      ...current,
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.code !== undefined ? { code: nextCode } : {}),
      updatedAt: new Date().toISOString(),
    };

    const pk = PK_PATH === '/id' ? current.id : current.code;
    const { resource } = await this.container.item(current.id, pk).replace(updated);
    return resource as LocationTypeDoc;
  }

  async remove(id: string): Promise<void> {
    const pk = PK_PATH === '/id' ? id : id;
    await this.container.item(id, pk).delete();
  }

  /**
   * Simple paging with page/pageSize like your previous API.
   * For very large offsets, prefer continuation tokens.
   */
  async list(opts: {
    page: number;
    pageSize: number;
    q?: string;
    code?: string;
    displayName?: string;
    sort?: 'createdAt' | 'updatedAt' | 'code' | 'displayName';
    order?: 'ASC' | 'DESC';
  }) {
    const { page, pageSize, q, code, displayName, sort = 'createdAt', order = 'ASC' } = opts;

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    if (q) {
      filters.push('(CONTAINS(LOWER(c.code), @q) OR CONTAINS(LOWER(c.displayName), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (code) {
      filters.push('c.code = @code');
      params.push({ name: '@code', value: code.trim().toUpperCase() });
    }
    if (displayName) {
      filters.push('CONTAINS(LOWER(c.displayName), @displayName)');
      params.push({ name: '@displayName', value: displayName.toLowerCase() });
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const queryText = `
      SELECT c.id, c.code, c.displayName, c.description, c.createdAt, c.updatedAt
      FROM c ${where}
      ORDER BY c.${sort} ${order}
    `;

    const iter = this.container.items.query<LocationTypeDoc>(
      { query: queryText, parameters: params },
      { maxItemCount: pageSize },
    );

    // Walk pages to the requested one (fine for small pages)
    let resources: LocationTypeDoc[] = [];
    let fetchedPage = 0;
    let next = await iter.fetchNext();
    while (next.resources && next.resources.length) {
      fetchedPage += 1;
      if (fetchedPage === page) {
        resources = next.resources;
        break;
      }
      if (!next.continuationToken) break;
      next = await iter.fetchNext();
    }

    return {
      items: resources as LocationTypeDoc[],
      // If you need 'total', run a COUNT query (costs RUs)
      total: resources.length,
      page,
      pageSize,
    };
  }
}
