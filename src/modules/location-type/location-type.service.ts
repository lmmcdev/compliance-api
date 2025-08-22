import { DataSource } from 'typeorm';
import {
  CreateLocationTypeSchema,
  UpdateLocationTypeSchema,
  ListLocationTypesSchema,
  type CreateLocationTypeDto,
  type UpdateLocationTypeDto,
  type ListLocationTypesQuery,
} from './location-type.dtos';
import { PageResult } from '../../shared';
import { LocationType } from './location-type.entity';
import { LocationTypeRepository, type ILocationTypeRepository } from './location-type.repository';
import { NotFoundError, ConflictError } from '../../http';

export interface ILocationTypeService {
  create(payload: unknown): Promise<LocationType>;
  update(id: string, payload: unknown): Promise<LocationType>;
  get(id: string): Promise<LocationType>;
  list(query: unknown): Promise<PageResult<LocationType>>;
  remove(id: string): Promise<void>;
}

export class LocationTypeService implements ILocationTypeService {
  private readonly repo: ILocationTypeRepository;

  constructor(ds: DataSource, repo?: ILocationTypeRepository) {
    this.repo = repo ?? new LocationTypeRepository(ds);
  }

  async create(payload: unknown): Promise<LocationType> {
    const dto: CreateLocationTypeDto = CreateLocationTypeSchema.parse(payload);

    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictError('A location type with this code already exists.');
    }

    const data: Partial<LocationType> = {
      code: dto.code,
      displayName: dto.displayName,
      description: dto.description ?? null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<LocationType> {
    const dto: UpdateLocationTypeDto = UpdateLocationTypeSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Location type not found');

    if (dto.code && dto.code !== current.code) {
      const exists = await this.repo.findByCode(dto.code);
      if (exists && exists.id !== id) {
        throw new ConflictError('A location type with this code already exists.');
      }
    }

    const patch: Partial<LocationType> = {
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Location type not found after update');
    return updated;
  }

  async get(id: string): Promise<LocationType> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Location type not found');
    return entity;
  }

  async list(query: unknown): Promise<PageResult<LocationType>> {
    const q: ListLocationTypesQuery = ListLocationTypesSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Location type not found');
    await this.repo.deleteHard(id);
  }
}
