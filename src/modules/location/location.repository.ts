// src/modules/location/location.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { LocationDoc } from './location.doc';
import { randomUUID } from 'crypto';

const CONTAINER_ID = 'locations';
const PK_PATH = '/locationTypeId';

export class LocationRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(data: Omit<LocationDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<LocationDoc> {
    const now = new Date().toISOString();

    const doc: LocationDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      // required
      locationTypeId: data.locationTypeId,
      name: data.name.trim(),
      // optionals / defaults
      description: data.description ?? null,
      externalReference: data.externalReference ?? null,
      addressId: data.addressId ?? null,
      visitorAddressId: data.visitorAddressId ?? null,
      timeZone: data.timeZone ?? 'America/New_York',
      drivingDirections: data.drivingDirections ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      parentLocationId: data.parentLocationId ?? null,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as LocationDoc;
  }

  // Point read requires both id and partition key (locationTypeId)
  async findById(id: string, locationTypeId: string): Promise<LocationDoc | null> {
    try {
      const { resource } = await this.container.item(id, locationTypeId).read<LocationDoc>();
      return resource ? (resource as LocationDoc) : null;
    } catch {
      return null;
    }
  }

  /**
   * List locations by locationTypeId (single-partition), with optional search & parent filter.
   * - q: searches name and externalReference (case-insensitive)
   * - parentLocationId: filter children of a parent; pass null to get roots (no parent)
   * - sort: createdAt | updatedAt | name
   * - order: ASC | DESC
   */
  async listByLocationType(
    locationTypeId: string,
    opts?: {
      pageSize?: number;
      token?: string;
      q?: string;
      parentLocationId?: string | null;
      sort?: 'createdAt' | 'updatedAt' | 'name';
      order?: 'ASC' | 'DESC';
    },
  ) {
    const {
      pageSize = 50,
      token,
      q,
      parentLocationId,
      sort = 'createdAt',
      order = 'DESC',
    } = opts ?? {};

    const filters: string[] = ['c.locationTypeId = @lt'];
    const params: { name: string; value: any }[] = [{ name: '@lt', value: locationTypeId }];

    if (q) {
      filters.push('(CONTAINS(LOWER(c.name), @q) OR CONTAINS(LOWER(c.externalReference), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }

    if (parentLocationId === null) {
      // roots: parent is undefined or null
      filters.push('(NOT IS_DEFINED(c.parentLocationId) OR IS_NULL(c.parentLocationId))');
    } else if (typeof parentLocationId === 'string') {
      filters.push('c.parentLocationId = @parent');
      params.push({ name: '@parent', value: parentLocationId });
    }

    const query: SqlQuerySpec = {
      query: `
        SELECT c.id, c.name, c.description, c.locationTypeId, c.externalReference,
               c.addressId, c.visitorAddressId, c.timeZone, c.drivingDirections,
               c.latitude, c.longitude, c.parentLocationId, c.createdAt, c.updatedAt
        FROM c
        WHERE ${filters.join(' AND ')}
        ORDER BY c.${sort} ${order}
      `,
      parameters: params,
    };

    const iter = this.container.items.query<LocationDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
    });

    const { resources, continuationToken } = await iter.fetchNext();
    return {
      items: resources.map((r) => r as LocationDoc),
      continuationToken: continuationToken ?? null,
    };
  }

  // Convenience: list direct children for a given parent
  async listChildren(
    locationTypeId: string,
    parentLocationId: string,
    opts?: {
      pageSize?: number;
      token?: string;
      sort?: 'createdAt' | 'updatedAt' | 'name';
      order?: 'ASC' | 'DESC';
    },
  ) {
    return this.listByLocationType(locationTypeId, {
      ...opts,
      parentLocationId,
    });
  }

  async update(
    id: string,
    locationTypeId: string,
    patch: Partial<Omit<LocationDoc, 'id' | 'createdAt' | 'locationTypeId'>>,
  ): Promise<LocationDoc | null> {
    const current = await this.findById(id, locationTypeId);
    if (!current) return null;

    const updated: LocationDoc = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.externalReference !== undefined
        ? { externalReference: patch.externalReference }
        : {}),
      ...(patch.addressId !== undefined ? { addressId: patch.addressId } : {}),
      ...(patch.visitorAddressId !== undefined ? { visitorAddressId: patch.visitorAddressId } : {}),
      ...(patch.timeZone !== undefined ? { timeZone: patch.timeZone } : {}),
      ...(patch.drivingDirections !== undefined
        ? { drivingDirections: patch.drivingDirections }
        : {}),
      ...(patch.latitude !== undefined ? { latitude: patch.latitude } : {}),
      ...(patch.longitude !== undefined ? { longitude: patch.longitude } : {}),
      ...(patch.parentLocationId !== undefined ? { parentLocationId: patch.parentLocationId } : {}),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, locationTypeId).replace(updated);
    return resource as LocationDoc;
  }

  async delete(id: string, locationTypeId: string): Promise<void> {
    await this.container.item(id, locationTypeId).delete();
  }
}
