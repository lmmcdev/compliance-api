import { DataSource, Repository } from 'typeorm';
import { LicenseType } from '../entities';
import { LicenseTypeCode } from '../types/enum.types';
import { ListLicenseTypesQuery } from '../dtos/license-type.dto';
import { PageResult } from '../dtos';

export interface ILicenseTypeRepository {
  createAndSave(data: Partial<LicenseType>): Promise<LicenseType>;
  updateAndSave(id: string, patch: Partial<LicenseType>): Promise<LicenseType | null>;
  findById(id: string): Promise<LicenseType | null>;
  findByCode(code: LicenseTypeCode): Promise<LicenseType | null>;
  list(query: ListLicenseTypesQuery): Promise<PageResult<LicenseType>>;
  deleteHard(id: string): Promise<void>;
}

export class LicenseTypeRepository implements ILicenseTypeRepository {
  private repo: Repository<LicenseType>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(LicenseType);
  }

  async createAndSave(data: Partial<LicenseType>): Promise<LicenseType> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<LicenseType>): Promise<LicenseType | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<LicenseType | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCode(code: LicenseTypeCode): Promise<LicenseType | null> {
    return this.repo.findOne({ where: { code } });
  }

  async list(q: ListLicenseTypesQuery): Promise<PageResult<LicenseType>> {
    const { page, pageSize, sort, order } = q;

    let qb = this.repo.createQueryBuilder('lt');

    if (q.q) {
      qb = qb.where('lt.code LIKE :search OR lt.name LIKE :search', {
        search: `%${q.q}%`,
      });
    }

    qb = qb
      .orderBy(`lt.${sort}`, order)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async deleteHard(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
