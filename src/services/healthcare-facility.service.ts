// src/services/healthcare-facility.service.ts
import { DataSource } from 'typeorm';
import {
  CreateHealthcareFacilitySchema,
  UpdateHealthcareFacilitySchema,
  ListHealthcareFacilitiesSchema,
  type CreateHealthcareFacilityDto,
  type UpdateHealthcareFacilityDto,
  type ListHealthcareFacilitiesQuery,
  PageResult,
} from '../dtos';

import { HealthcareFacility } from '../entities';
import { HealthcareFacilityRepository, type IHealthcareFacilityRepository } from '../repositories';
import { NotFoundError } from '../http/app-error';

export interface IHealthcareFacilityService {
  create(payload: unknown): Promise<HealthcareFacility>;
  update(id: string, payload: unknown): Promise<HealthcareFacility>;
  get(id: string): Promise<HealthcareFacility>;
  list(query: unknown): Promise<PageResult<HealthcareFacility>>;
  remove(id: string): Promise<void>;
}

export class HealthcareFacilityService implements IHealthcareFacilityService {
  private readonly repo: IHealthcareFacilityRepository;

  constructor(ds: DataSource, repo?: IHealthcareFacilityRepository) {
    this.repo = repo ?? new HealthcareFacilityRepository(ds);
  }

  async create(payload: unknown): Promise<HealthcareFacility> {
    const dto: CreateHealthcareFacilityDto = CreateHealthcareFacilitySchema.parse(payload);

    const data: Partial<HealthcareFacility> = {
      name: dto.name,
      location: dto.location ?? null,
      locationType: dto.locationType ?? null,
      licensedBedCount: dto.licensedBedCount ?? null,
      facilityType: dto.facilityType ?? null,
      availabilityExceptions: dto.availabilityExceptions ?? null,
      alwaysOpen: dto.alwaysOpen ?? false,
      sourceSystem: dto.sourceSystem ?? null,
      sourceSystemId: dto.sourceSystemId ?? null,
      sourceSystemModified: dto.sourceSystemModified ?? null,

      // relations
      account: { id: dto.accountId } as any,
      address: dto.addressId ? ({ id: dto.addressId } as any) : null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<HealthcareFacility> {
    const dto: UpdateHealthcareFacilityDto = UpdateHealthcareFacilitySchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Healthcare facility not found');

    const patch: Partial<HealthcareFacility> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.locationType !== undefined ? { locationType: dto.locationType } : {}),
      ...(dto.licensedBedCount !== undefined ? { licensedBedCount: dto.licensedBedCount } : {}),
      ...(dto.facilityType !== undefined ? { facilityType: dto.facilityType } : {}),
      ...(dto.availabilityExceptions !== undefined
        ? { availabilityExceptions: dto.availabilityExceptions }
        : {}),
      ...(dto.alwaysOpen !== undefined ? { alwaysOpen: dto.alwaysOpen } : {}),
      ...(dto.sourceSystem !== undefined ? { sourceSystem: dto.sourceSystem } : {}),
      ...(dto.sourceSystemId !== undefined ? { sourceSystemId: dto.sourceSystemId } : {}),
      ...(dto.sourceSystemModified !== undefined
        ? { sourceSystemModified: dto.sourceSystemModified }
        : {}),

      // relations
      ...(dto.accountId !== undefined ? { account: { id: dto.accountId } as any } : {}),
      ...(dto.addressId !== undefined
        ? { address: dto.addressId ? ({ id: dto.addressId } as any) : null }
        : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Healthcare facility not found after update');
    return updated;
  }

  async get(id: string): Promise<HealthcareFacility> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Healthcare facility not found');
    return entity;
  }

  async list(query: unknown): Promise<PageResult<HealthcareFacility>> {
    const q: ListHealthcareFacilitiesQuery = ListHealthcareFacilitiesSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Healthcare facility not found');
    await this.repo.deleteHard(id);
  }
}
