// src/modules/location-type/location-type.service.ts
import { LocationTypeRepository } from './location-type.repository';
import {
  CreateLocationTypeSchema,
  UpdateLocationTypeSchema,
  ListLocationTypesSchema,
} from './location-type.dto'; // adjust if your file is named differently
import { LocationTypeDoc } from './location-type.doc';
import { PageResult } from '../../shared';
import { ConflictError, NotFoundError } from '../../http/app-error';

export class LocationTypeService {
  constructor(private readonly repo: LocationTypeRepository) {}

  static async createInstance() {
    const repo = await new LocationTypeRepository().init();
    return new LocationTypeService(repo);
  }

  async create(payload: unknown): Promise<LocationTypeDoc> {
    const dto = CreateLocationTypeSchema.parse(payload);
    const exists = await this.repo.findByCode(dto.code);
    if (exists) throw new ConflictError(`Location type with code ${dto.code} already exists.`);

    return this.repo.create({
      code: dto.code,
      displayName: dto.displayName,
      description: dto.description ?? null,
    });
  }

  async update(id: string, payload: unknown): Promise<LocationTypeDoc> {
    const dto = UpdateLocationTypeSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError(`Location type with id ${id} not found.`);

    if (dto.code && dto.code.trim().toUpperCase() !== current.code) {
      const clash = await this.repo.findByCode(dto.code);
      if (clash) throw new ConflictError(`Location type with code ${dto.code} already exists.`);
    }

    const updated = await this.repo.update(id, {
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });

    if (!updated) throw new NotFoundError('Location type not found after update');
    return updated;
  }

  async get(id: string): Promise<LocationTypeDoc> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`Location type with id ${id} not found.`);
    return found;
  }

  async list(query: unknown): Promise<PageResult<LocationTypeDoc>> {
    const q = ListLocationTypesSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`Location type with id ${id} not found.`);
    await this.repo.remove(id);
  }
}
