import { DataSource } from 'typeorm';
import { z } from 'zod';
import { LicenseType } from '../entities/licenseType.entity';
import { LicenseTypeRepository } from '../repositories/licenseType.repository';

export const createSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(256).optional().nullable(),
});

export const updateSchema = createSchema.partial();

export class LicenseTypeService {
  private repo: LicenseTypeRepository;

  constructor(ds: DataSource) {
    this.repo = new LicenseTypeRepository(ds);
  }

  async list(page = 1, pageSize = 20) {
    const take = Math.max(1, Math.min(pageSize, 100));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.repo.findPaged(skip, take);
    return {
      items,
      page,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  get(id: string) {
    return this.repo.findById(id);
  }

  async create(payload: unknown) {
    const data = createSchema.parse(payload) as Pick<LicenseType, 'name' | 'description'>;
    return this.repo.createOne(data);
  }

  async update(id: string, payload: unknown) {
    const data = updateSchema.parse(payload) as Partial<LicenseType>;
    const updated = await this.repo.updateOne(id, data);
    return updated;
  }

  async remove(id: string) {
    await this.repo.softDelete(id);
  }
}
