import { DataSource } from 'typeorm';
import { LicenseType } from './license-type.entity';
import { LicenseTypeCode } from '../../types/enum.types';
import { LicenseTypeRepository } from './license-type.repository';
import {
  CreateLicenseTypeSchema,
  ListLicenseTypesSchema,
  UpdateLicenseTypeSchema,
  CreateLicenseTypeDto,
  UpdateLicenseTypeDto,
} from './license-type.dtos';
import { PageResult } from '../../shared';
import { ConflictError, NotFoundError } from '../../http/app-error';

export interface ILicenseTypeService {
  create(payload: unknown): Promise<LicenseType>;
  update(id: string, payload: unknown): Promise<LicenseType>;
  get(id: string): Promise<LicenseType | null>;
  list(query: unknown): Promise<PageResult<LicenseType>>;
  remove(id: string): Promise<void>;
}

export class LicenseTypeService implements ILicenseTypeService {
  private repo: LicenseTypeRepository;

  constructor(ds: DataSource, repo?: LicenseTypeRepository) {
    this.repo = repo ?? new LicenseTypeRepository(ds);
  }

  async create(payload: unknown): Promise<LicenseType> {
    const dto: CreateLicenseTypeDto = CreateLicenseTypeSchema.parse(payload);

    const existing = await this.repo.findByCode(dto.code as LicenseTypeCode);
    if (existing) {
      throw new ConflictError(`License type with code ${dto.code} already exists.`);
    }

    const data: Partial<LicenseType> = {
      code: dto.code,
      displayName: dto.displayName,
      description: dto.description ?? null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<LicenseType> {
    const dto: UpdateLicenseTypeDto = UpdateLicenseTypeSchema.parse(payload);

    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError(`License type with id ${id} not found.`);

    if (dto.code !== current.code) {
      const existing = await this.repo.findByCode(dto.code as LicenseTypeCode);
      if (existing) {
        throw new ConflictError(`License type with code ${dto.code} already exists.`);
      }
    }

    const patch: Partial<LicenseType> = {
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('License type not found after update');
    return updated;
  }

  async get(id: string): Promise<LicenseType> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`License type with id ${id} not found.`);
    return found;
  }

  async list(query: unknown): Promise<PageResult<LicenseType>> {
    const q = ListLicenseTypesSchema.parse(query);
    return await this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`License type with id ${id} not found.`);
    await this.repo.deleteHard(id);
  }
}
