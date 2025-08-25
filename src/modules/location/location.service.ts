// src/modules/location/location.service.ts
import { LocationRepository } from './location.repository';
import { LocationDoc } from './location.doc';
import { CreateLocationSchema, UpdateLocationSchema, ListLocationsSchema } from './location.dto';
import { NotFoundError } from '../../http/app-error';

export interface ILocationService {
  create(payload: unknown): Promise<LocationDoc>;
  update(id: string, locationTypeId: string, payload: unknown): Promise<LocationDoc>;
  get(id: string, locationTypeId: string): Promise<LocationDoc>;
  list(query: unknown): Promise<{ items: LocationDoc[]; continuationToken: string | null }>;
  remove(id: string, locationTypeId: string): Promise<void>;
}

export class LocationService implements ILocationService {
  constructor(private readonly repo: LocationRepository) {}

  /** Factory for uniform initialization (mirrors AddressService pattern) */
  static async createInstance(): Promise<LocationService> {
    const repo = await new LocationRepository().init();
    return new LocationService(repo);
  }

  async create(payload: unknown): Promise<LocationDoc> {
    // Expecting: { locationTypeId, name, description?, externalReference?,
    //              addressId?, visitorAddressId?, timeZone?, drivingDirections?,
    //              latitude?, longitude?, parentLocationId? }
    const dto = CreateLocationSchema.parse(payload);
    return this.repo.create(dto);
  }

  async update(id: string, locationTypeId: string, payload: unknown): Promise<LocationDoc> {
    const patch = UpdateLocationSchema.parse(payload);

    const current = await this.repo.findById(id, locationTypeId);
    if (!current) {
      throw new NotFoundError(`Location ${id} not found for locationType ${locationTypeId}.`);
    }

    const updated = await this.repo.update(id, locationTypeId, patch);
    if (!updated) throw new NotFoundError('Location not found after update');
    return updated;
  }

  async get(id: string, locationTypeId: string): Promise<LocationDoc> {
    const found = await this.repo.findById(id, locationTypeId);
    if (!found) {
      throw new NotFoundError(`Location ${id} not found for locationType ${locationTypeId}.`);
    }
    return found;
  }

  /**
   * Token-based paging within a single partition (/locationTypeId).
   * Query shape: {
   *   locationTypeId: string,
   *   pageSize?: number,
   *   token?: string,
   *   q?: string,
   *   parentLocationId?: string | null,
   *   sort?: 'createdAt' | 'updatedAt' | 'name',
   *   order?: 'ASC' | 'DESC'
   * }
   */
  async list(query: unknown): Promise<{ items: LocationDoc[]; continuationToken: string | null }> {
    const q = ListLocationsSchema.parse(query);
    return this.repo.listByLocationType(q.locationTypeId, {
      pageSize: q.pageSize,
      token: q.token,
      q: q.q,
      parentLocationId: q.parentLocationId,
      sort: q.sort,
      order: q.order,
    });
  }

  async remove(id: string, locationTypeId: string): Promise<void> {
    const found = await this.repo.findById(id, locationTypeId);
    if (!found) {
      throw new NotFoundError(`Location ${id} not found for locationType ${locationTypeId}.`);
    }
    await this.repo.delete(id, locationTypeId);
  }
}
