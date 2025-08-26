// src/modules/healthcare-facility/healthcare-facility.repository.ts
import { Container, SqlQuerySpec, RequestOptions, PatchOperation } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { HealthcareFacilityDoc } from './healthcare-facility.doc';
import { randomUUID } from 'crypto';

const CONTAINER_ID = 'healthcare_facilities';
const PK_PATH = '/accountId';

export class HealthcareFacilityRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(
    data: Omit<HealthcareFacilityDoc, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<HealthcareFacilityDoc> {
    if (!data.accountId) throw new Error('accountId is required');

    const now = new Date().toISOString();
    const doc: HealthcareFacilityDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,

      accountId: data.accountId,
      name: data.name.trim(),

      location: data.location ?? null,
      locationType: data.locationType ?? null,
      licensedBedCount: data.licensedBedCount ?? null,

      facilityType: data.facilityType ?? null,

      availabilityExceptions: data.availabilityExceptions ?? null,
      alwaysOpen: data.alwaysOpen ?? false,

      sourceSystem: data.sourceSystem ?? null,
      sourceSystemId: data.sourceSystemId ?? null,
      sourceSystemModified: data.sourceSystemModified ?? null,

      addressId: data.addressId ?? null,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as HealthcareFacilityDoc;
  }

  /** Point read: requiere id y accountId (PK) */
  async findById(id: string, accountId: string): Promise<HealthcareFacilityDoc | null> {
    try {
      const { resource } = await this.container.item(id, accountId).read<HealthcareFacilityDoc>();
      return resource ?? null;
    } catch {
      return null;
    }
  }

  /** Búsqueda rápida por sistema externo (opcional) dentro de una cuenta */
  async findBySourceSystemId(
    accountId: string,
    sourceSystemId: string,
  ): Promise<HealthcareFacilityDoc | null> {
    const spec: SqlQuerySpec = {
      query: `SELECT TOP 1 * FROM c 
              WHERE c.accountId = @accountId AND c.sourceSystemId = @ssid`,
      parameters: [
        { name: '@accountId', value: accountId },
        { name: '@ssid', value: sourceSystemId },
      ],
    };
    const { resources } = await this.container.items
      .query<HealthcareFacilityDoc>(spec, { partitionKey: accountId })
      .fetchAll();
    return resources[0] ?? null;
  }

  /**
   * List por cuenta (single-partition), con filtros básicos.
   * - q: busca en name/location (case-insensitive)
   * - addressId: filtra por dirección asociada
   * - sort/order: 'createdAt' | 'updatedAt' | 'name'
   */
  async listByAccount(
    accountId: string,
    opts?: {
      pageSize?: number;
      token?: string;
      q?: string;
      addressId?: string | null;
      sort?: 'createdAt' | 'updatedAt' | 'name';
      order?: 'ASC' | 'DESC';
    },
  ): Promise<{ items: HealthcareFacilityDoc[]; continuationToken: string | null }> {
    const { pageSize = 50, token, q, addressId, sort = 'createdAt', order = 'DESC' } = opts ?? {};

    const filters: string[] = ['c.accountId = @accountId'];
    const params: { name: string; value: any }[] = [{ name: '@accountId', value: accountId }];

    if (q) {
      filters.push('(CONTAINS(LOWER(c.name), @q) OR CONTAINS(LOWER(c.location), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (addressId === null) {
      filters.push('(NOT IS_DEFINED(c.addressId) OR IS_NULL(c.addressId))');
    } else if (typeof addressId === 'string') {
      filters.push('c.addressId = @addressId');
      params.push({ name: '@addressId', value: addressId });
    }

    const spec: SqlQuerySpec = {
      query: `
        SELECT c.id, c.accountId, c.name, c.location, c.locationType, c.licensedBedCount,
               c.facilityType, c.availabilityExceptions, c.alwaysOpen,
               c.sourceSystem, c.sourceSystemId, c.sourceSystemModified,
               c.addressId, c.createdAt, c.updatedAt
        FROM c
        WHERE ${filters.join(' AND ')}
        ORDER BY c.${sort} ${order}
      `,
      parameters: params,
    };

    const iter = this.container.items.query<HealthcareFacilityDoc>(spec, {
      partitionKey: accountId,
      maxItemCount: pageSize,
      continuationToken: token,
    });

    const { resources, continuationToken } = await iter.fetchNext();
    return { items: resources, continuationToken: continuationToken ?? null };
  }

  /** PATCH eficiente para campos individuales */
  async patch(
    id: string,
    accountId: string,
    ops: PatchOperation[],
    options?: RequestOptions,
  ): Promise<HealthcareFacilityDoc | null> {
    const { resource } = await this.container
      .item(id, accountId)
      .patch<HealthcareFacilityDoc>(
        [...ops, { op: 'set', path: '/updatedAt', value: new Date().toISOString() }],
        options,
      );
    return resource ?? null;
  }

  /** Update con replace (si prefieres full overwrite) */
  async update(
    id: string,
    accountId: string,
    patch: Partial<Omit<HealthcareFacilityDoc, 'id' | 'accountId' | 'createdAt'>>,
  ): Promise<HealthcareFacilityDoc | null> {
    const current = await this.findById(id, accountId);
    if (!current) return null;

    const updated: HealthcareFacilityDoc = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.locationType !== undefined ? { locationType: patch.locationType } : {}),
      ...(patch.licensedBedCount !== undefined ? { licensedBedCount: patch.licensedBedCount } : {}),
      ...(patch.facilityType !== undefined ? { facilityType: patch.facilityType } : {}),
      ...(patch.availabilityExceptions !== undefined
        ? { availabilityExceptions: patch.availabilityExceptions }
        : {}),
      ...(patch.alwaysOpen !== undefined ? { alwaysOpen: !!patch.alwaysOpen } : {}),
      ...(patch.sourceSystem !== undefined ? { sourceSystem: patch.sourceSystem } : {}),
      ...(patch.sourceSystemId !== undefined ? { sourceSystemId: patch.sourceSystemId } : {}),
      ...(patch.sourceSystemModified !== undefined
        ? { sourceSystemModified: patch.sourceSystemModified }
        : {}),
      ...(patch.addressId !== undefined ? { addressId: patch.addressId } : {}),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, accountId).replace(updated);
    return resource ?? null;
  }

  async delete(id: string, accountId: string): Promise<void> {
    await this.container.item(id, accountId).delete();
  }
}
