// src/modules/license-type/license-type.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { LicenseTypeDoc } from './license-type.doc';
import { ListLicenseTypesQuery } from './license-type.dto';
import { PageResult } from '../../shared';
import { randomUUID } from 'crypto';
import { BadRequestError, ConflictError } from '../../http';

// Container + partition key
const CONTAINER_ID = 'license_types';
const PK_PATH = '/id';

export interface ILicenseTypeRepository {
  createAndSave(data: Partial<LicenseTypeDoc>): Promise<LicenseTypeDoc>;
  updateAndSave(id: string, patch: Partial<LicenseTypeDoc>): Promise<LicenseTypeDoc | null>;
  findById(id: string): Promise<LicenseTypeDoc | null>;
  findByCode(code: string): Promise<LicenseTypeDoc | null>;
  list(query: ListLicenseTypesQuery): Promise<PageResult<LicenseTypeDoc>>;
  deleteHard(id: string): Promise<void>;
}

export class LicenseTypeRepository implements ILicenseTypeRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });

    return this;
  }

  async createAndSave(data: Partial<LicenseTypeDoc>): Promise<LicenseTypeDoc> {
    if (!data?.code) throw new BadRequestError('code is required');

    // Enforce unique code
    const existing = await this.findByCode(data.code);
    if (existing) throw new ConflictError(`License type with code ${data.code} already exists.`);

    const now = new Date().toISOString();
    const doc: LicenseTypeDoc = {
      id: randomUUID(),
      code: data.code!,
      displayName: data.displayName ?? null,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as LicenseTypeDoc;
  }

  async updateAndSave(id: string, patch: Partial<LicenseTypeDoc>): Promise<LicenseTypeDoc | null> {
    const current = await this.findById(id);
    if (!current) return null;

    // If changing code, ensure uniqueness
    if (patch.code && patch.code !== current.code) {
      const clash = await this.findByCode(patch.code);
      if (clash) throw new ConflictError(`License type with code ${patch.code} already exists.`);
    }

    const updated: LicenseTypeDoc = {
      ...current,
      ...(patch.code !== undefined ? { code: patch.code } : {}),
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      updatedAt: new Date().toISOString(),
    };

    const pk = PK_PATH === '/id' ? current.id : current.code;
    const { resource } = await this.container.item(current.id, pk).replace(updated);
    return resource as LicenseTypeDoc;
  }

  async findById(id: string): Promise<LicenseTypeDoc | null> {
    try {
      const pk = PK_PATH === '/id' ? id : id; // adjust if you switch PK
      const { resource } = await this.container.item(id, pk).read<LicenseTypeDoc>();
      return resource ?? null;
    } catch {
      return null;
    }
  }

  async findByCode(code: string): Promise<LicenseTypeDoc | null> {
    const codeU = code.trim().toUpperCase();

    const query: SqlQuerySpec = {
      query: 'SELECT TOP 1 * FROM c WHERE UPPER(c.code) = @code',
      parameters: [{ name: '@code', value: codeU }],
    };

    const { resources } = await this.container.items.query<LicenseTypeDoc>(query).fetchAll();
    return resources[0] ?? null;
  }

  /**
   * Basic page/pageSize implementation by advancing the iterator.
   * Fine for small pages; for large offsets prefer continuation tokens.
   */
  async list(q: ListLicenseTypesQuery): Promise<PageResult<LicenseTypeDoc>> {
    const { page, pageSize, q: search, code, displayName, sort, order } = q;

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    if (search) {
      filters.push('(CONTAINS(LOWER(c.code), @search) OR CONTAINS(LOWER(c.displayName), @search))');
      params.push({ name: '@search', value: search.toLowerCase() });
    }
    if (code) {
      filters.push('c.code = @code');
      params.push({ name: '@code', value: code });
    }
    if (displayName) {
      filters.push('CONTAINS(LOWER(c.displayName), @displayName)');
      params.push({ name: '@displayName', value: displayName.toLowerCase() });
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const queryText = `SELECT * FROM c ${where} ORDER BY c.${sort} ${order}`;

    const iter = this.container.items.query<LicenseTypeDoc>(
      { query: queryText, parameters: params },
      { maxItemCount: pageSize },
    );

    // advance to the requested page
    let resources: LicenseTypeDoc[] = [];
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

    // Cosmos doesn't give "total" cheaply; you can omit it or estimate.
    // If you must return total, run a COUNT query (extra RU cost).
    const total = undefined as unknown as number; // or implement COUNT if needed

    return {
      items: resources,
      total: total ?? resources.length, // placeholder if you keep the type
      page,
      pageSize,
    };
  }

  async deleteHard(id: string): Promise<void> {
    const pk = PK_PATH === '/id' ? id : id;
    await this.container.item(id, pk).delete();
  }

  async deleteAll(): Promise<void> {
    const query = { query: 'SELECT c.id FROM c' };
    const { resources } = await this.container.items.query<{ id: string }>(query).fetchAll();
    for (const doc of resources) {
      await this.deleteHard(doc.id);
    }
  }
}
