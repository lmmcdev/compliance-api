import { DataSource } from 'typeorm';
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  ListAddressesSchema,
  type CreateAddressDto,
  type UpdateAddressDto,
  type ListAddressesQuery,
} from './address.dtos';
import type { PageResult } from '../../shared';

import { Address } from './address.entity';
import { AddressRepository, type IAddressRepository } from './address.repository';
import { NotFoundError } from '../../http';

export interface IAddressService {
  create(payload: unknown): Promise<Address>;
  update(id: string, payload: unknown): Promise<Address>;
  get(id: string): Promise<Address>;
  list(query: unknown): Promise<PageResult<Address>>;
  remove(id: string): Promise<void>;
}

export class AddressService implements IAddressService {
  private readonly repo: IAddressRepository;

  constructor(ds: DataSource, repo?: IAddressRepository) {
    this.repo = repo ?? new AddressRepository(ds);
  }

  async create(payload: unknown): Promise<Address> {
    const dto: CreateAddressDto = CreateAddressSchema.parse(payload);

    const data: Partial<Address> = {
      street: dto.street,
      city: dto.city,
      state: dto.state,
      zip: dto.zip,
      country: dto.country,
      addressType: dto.addressType,
      drivingDirections: dto.drivingDirections ?? null,
      description: dto.description ?? null,
      timeZone: dto.timeZone ?? null,
      lead: dto.lead ?? null,
      locationType: { id: dto.locationTypeId } as any,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<Address> {
    const dto: UpdateAddressDto = UpdateAddressSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Address not found');

    const patch: Partial<Address> = {
      ...(dto.street !== undefined ? { street: dto.street } : {}),
      ...(dto.city !== undefined ? { city: dto.city } : {}),
      ...(dto.state !== undefined ? { state: dto.state } : {}),
      ...(dto.zip !== undefined ? { zip: dto.zip } : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
      ...(dto.addressType !== undefined ? { addressType: dto.addressType } : {}),
      ...(dto.drivingDirections !== undefined ? { drivingDirections: dto.drivingDirections } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.timeZone !== undefined ? { timeZone: dto.timeZone } : {}),
      ...(dto.lead !== undefined ? { lead: dto.lead } : {}),
      ...(dto.locationTypeId !== undefined
        ? { locationType: { id: dto.locationTypeId } as any }
        : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Address not found after update');
    return updated;
  }

  async get(id: string): Promise<Address> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Address not found');
    return entity;
  }

  async list(query: unknown): Promise<PageResult<Address>> {
    const q: ListAddressesQuery = ListAddressesSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Address not found');
    await this.repo.deleteHard(id);
  }
}
