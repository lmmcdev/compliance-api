import { DataSource } from 'typeorm';
import { z } from 'zod';
import { LicenseType, LicenseTypeCode } from '../entities/license-type.entity';
import { LicenseTypeRepository } from '../repositories/license-type.repository';

export const createSchema = z.object({
  code: z.enum(LicenseTypeCode),
  displayName: z.string().max(128),
  description: z.string().max(256).optional().nullable(),
});
export const updateSchema = createSchema.partial();

export class LicenseTypeService {
  private repo: LicenseTypeRepository;
  constructor(ds: DataSource) {
    this.repo = new LicenseTypeRepository(ds);
  }
  list(page?: number, pageSize?: number) {
    return this.repo.findPaged(page, pageSize);
  }
  get(id: string) {
    return this.repo.findById(id);
  }
  create(payload: unknown) {
    const data = createSchema.parse(payload) as Pick<
      LicenseType,
      'code' | 'displayName' | 'description'
    >;
    return this.repo.createOne(data);
  }
  update(id: string, payload: unknown) {
    const data = updateSchema.parse(payload) as Partial<LicenseType>;
    return this.repo.updateOne(id, data);
  }
  remove(id: string) {
    return this.repo.softDelete(id);
  }
}
