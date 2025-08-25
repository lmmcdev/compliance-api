// src/modules/license-type/license-type.service.ts
import { LicenseTypeRepository } from './license-type.repository';
import {
  CreateLicenseTypeSchema,
  ListLicenseTypesSchema,
  UpdateLicenseTypeSchema,
  CreateLicenseTypeDto,
  UpdateLicenseTypeDto,
} from './license-type.dto';
import { PageResult } from '../../shared';
import { ConflictError, NotFoundError } from '../../http/app-error';
import { LicenseTypeDoc } from './license-type.doc';

export interface ILicenseTypeService {
  create(payload: unknown): Promise<LicenseTypeDoc>;
  update(id: string, payload: unknown): Promise<LicenseTypeDoc>;
  get(id: string): Promise<LicenseTypeDoc>;
  list(query: unknown): Promise<PageResult<LicenseTypeDoc>>;
  remove(id: string): Promise<void>;
  getByCode(code: string): Promise<LicenseTypeDoc | null>;
}

export class LicenseTypeService implements ILicenseTypeService {
  constructor(private readonly repo: LicenseTypeRepository) {}

  static async createInstance(): Promise<LicenseTypeService> {
    const repo = await new LicenseTypeRepository().init();
    return new LicenseTypeService(repo);
  }

  async create(payload: unknown): Promise<LicenseTypeDoc> {
    const dto: CreateLicenseTypeDto = CreateLicenseTypeSchema.parse(payload);

    const existing = await this.repo.findByCode(dto.code);
    if (existing) throw new ConflictError(`License type with code ${dto.code} already exists.`);

    return this.repo.createAndSave({
      code: dto.code,
      displayName: dto.displayName,
      description: dto.description ?? null,
    });
  }

  async update(id: string, payload: unknown): Promise<LicenseTypeDoc> {
    const dto: UpdateLicenseTypeDto = UpdateLicenseTypeSchema.parse(payload);

    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError(`License type with id ${id} not found.`);

    if (dto.code && dto.code !== current.code) {
      const clash = await this.repo.findByCode(dto.code);
      if (clash) throw new ConflictError(`License type with code ${dto.code} already exists.`);
    }

    const updated = await this.repo.updateAndSave(id, {
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
    });

    if (!updated) throw new NotFoundError('License type not found after update');
    return updated;
  }

  async get(id: string): Promise<LicenseTypeDoc> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`License type with id ${id} not found.`);
    return found;
  }

  async list(query: unknown): Promise<PageResult<LicenseTypeDoc>> {
    const q = ListLicenseTypesSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError(`License type with id ${id} not found.`);
    await this.repo.deleteHard(id);
  }

  async getByCode(code: string): Promise<LicenseTypeDoc> {
    const found = await this.repo.findByCode(code);
    if (!found) throw new NotFoundError(`License type with code ${code} not found.`);
    return found;
  }
}
