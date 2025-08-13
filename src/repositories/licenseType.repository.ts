import { DataSource, Repository } from 'typeorm';
import { LicenseType } from '../entities/licenseType.entity';

export class LicenseTypeRepository {
  private repo: Repository<LicenseType>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(LicenseType);
  }

  findPaged(skip: number, take: number) {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async createOne(data: Partial<LicenseType>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateOne(id: string, data: Partial<LicenseType>) {
    const found = await this.findById(id);
    if (!found) return null;
    Object.assign(found, data);
    return this.repo.save(found);
  }

  async softDelete(id: string) {
    // Uses DeleteDateColumn (soft delete)
    await this.repo.softDelete(id);
  }
}
