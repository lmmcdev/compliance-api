import { DataSource } from 'typeorm';
import { z, ZodError } from 'zod';
import { LicenseType } from '../entities/license-type.entity';
import { LicenseTypeCode } from '../types/enum.type';
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

  private handleError(err: unknown, op: string): never {
    // Let Zod errors bubble up so your route can return 400 with details
    if (err instanceof ZodError) throw err;

    const msg =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    throw new Error(`[LicenseTypeService] ${op} failed: ${msg}`);
  }

  async list(page?: number, pageSize?: number) {
    try {
      return await this.repo.findPaged(page, pageSize);
    } catch (err) {
      this.handleError(err, 'list');
    }
  }

  async get(id: string) {
    try {
      return await this.repo.findById(id); // may return null
    } catch (err) {
      this.handleError(err, 'get');
    }
  }

  async create(payload: unknown) {
    try {
      const data = createSchema.parse(payload) as Pick<
        LicenseType,
        'code' | 'displayName' | 'description'
      >;
      return await this.repo.createOne(data);
    } catch (err) {
      this.handleError(err, 'create');
    }
  }

  async update(id: string, payload: unknown) {
    try {
      const data = updateSchema.parse(payload) as Partial<LicenseType>;
      return await this.repo.updateOne(id, data); // may return null
    } catch (err) {
      this.handleError(err, 'update');
    }
  }

  async remove(id: string) {
    try {
      await this.repo.softDelete(id);
    } catch (err) {
      this.handleError(err, 'remove');
    }
  }

  async findByCode(code: LicenseTypeCode) {
    try {
      return await this.repo.findByCode(code);
    } catch (err) {
      this.handleError(err, 'findByCode');
    }
  }
}
