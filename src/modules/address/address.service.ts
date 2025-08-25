// src/modules/address/address.service.ts
import { AddressRepository } from './address.repository';
import { AddressDoc } from './address.doc';
import { CreateAddressSchema, UpdateAddressSchema, ListAddressesSchema } from './address.dto';
import { NotFoundError } from '../../http/app-error';

export interface IAddressService {
  create(payload: unknown): Promise<AddressDoc>;
  update(id: string, locationTypeId: string, payload: unknown): Promise<AddressDoc>;
  get(id: string, locationTypeId: string): Promise<AddressDoc>;
  list(query: unknown): Promise<{ items: AddressDoc[]; continuationToken: string | null }>;
  remove(id: string, locationTypeId: string): Promise<void>;
}

export class AddressService implements IAddressService {
  constructor(private readonly repo: AddressRepository) {}

  /** Factory to keep init uniform with your other services */
  static async createInstance(): Promise<AddressService> {
    const repo = await new AddressRepository().init();
    return new AddressService(repo);
  }

  async create(payload: unknown): Promise<AddressDoc> {
    const dto = CreateAddressSchema.parse(payload);
    // repo handles normalization (state/country/zip) and timestamps
    return this.repo.create(dto);
  }

  async update(id: string, locationTypeId: string, payload: unknown): Promise<AddressDoc> {
    const dto = UpdateAddressSchema.parse(payload);

    const current = await this.repo.findById(id, locationTypeId);
    if (!current) {
      throw new NotFoundError(`Address ${id} not found for locationType ${locationTypeId}.`);
    }

    const updated = await this.repo.update(id, locationTypeId, dto);
    if (!updated) throw new NotFoundError('Address not found after update');
    return updated;
  }

  async get(id: string, locationTypeId: string): Promise<AddressDoc> {
    const found = await this.repo.findById(id, locationTypeId);
    if (!found) {
      throw new NotFoundError(`Address ${id} not found for locationType ${locationTypeId}.`);
    }
    return found;
  }

  /**
   * Token-based paging within a single partition (/locationTypeId).
   * Query shape: { locationTypeId, pageSize?, token?, q?, addressType? }
   */
  async list(query: unknown): Promise<{ items: AddressDoc[]; continuationToken: string | null }> {
    const q = ListAddressesSchema.parse(query);
    return this.repo.listByLocationType(q.locationTypeId, {
      pageSize: q.pageSize,
      token: q.token,
      q: q.q,
      addressType: q.addressType,
    });
  }

  async remove(id: string, locationTypeId: string): Promise<void> {
    const found = await this.repo.findById(id, locationTypeId);
    if (!found) {
      throw new NotFoundError(`Address ${id} not found for locationType ${locationTypeId}.`);
    }
    await this.repo.delete(id, locationTypeId);
  }
}
