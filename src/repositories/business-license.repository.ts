import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { BusinessLicense } from '../entities';
import { ListBusinessLicensesQuery, PageResult } from '../dtos';

export interface IBusinessLicenseRepository {
  createAndSave(data: Partial<BusinessLicense>): Promise<BusinessLicense>;
  updateAndSave(id: string, patch: Partial<BusinessLicense>): Promise<BusinessLicense>;
  findById(id: string): Promise<BusinessLicense | null>;
  findByLicenseNumber(
    licenseNumber: string,
    accountId?: string | null,
  ): Promise<BusinessLicense | null>;
  list(query: ListBusinessLicensesQuery): Promise<PageResult<BusinessLicense>>;
  deleteHard(id: string): Promise<void>;
}

export class BusinessLicenseRepository implements IBusinessLicenseRepository {
  private repo: Repository<BusinessLicense>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(BusinessLicense);
  }

  async createAndSave(data: Partial<BusinessLicense>): Promise<BusinessLicense> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<BusinessLicense>): Promise<BusinessLicense> {
    await this.repo.update({ id }, patch);
    const updated = await this.repo.findOne({
      where: { id },
      relations: {
        licenseType: true,
        healthcareFacility: true,
        healthcareProvider: true,
        account: true,
      },
    });
    if (!updated) return null as unknown as BusinessLicense;
    return updated;
  }

  async findById(id: string): Promise<BusinessLicense | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        licenseType: true,
        healthcareFacility: true,
        healthcareProvider: true,
        account: true,
      },
    });
  }

  async findByLicenseNumber(
    licenseNumber: string,
    accountId?: string | null,
  ): Promise<BusinessLicense | null> {
    return this.repo.findOne({
      where: accountId ? { licenseNumber, account: { id: accountId } } : { licenseNumber },
      relations: { account: true },
    });
  }

  async list(q: ListBusinessLicensesQuery): Promise<PageResult<BusinessLicense>> {
    const { page, pageSize, sort, order } = q;

    let qb: SelectQueryBuilder<BusinessLicense> = this.repo
      .createQueryBuilder('bl')
      .leftJoinAndSelect('bl.licenseType', 'lt')
      .leftJoinAndSelect('bl.healthcareFacility', 'hf')
      .leftJoinAndSelect('bl.healthcareProvider', 'hp')
      .leftJoinAndSelect('bl.account', 'acc');

    if (q.q) {
      qb = qb.andWhere(
        '(bl.name LIKE :q OR bl.licenseNumber LIKE :q OR bl.certificateNumber LIKE :q OR bl.description LIKE :q)',
        { q: `%${q.q}%` },
      );
    }
    if (typeof q.isActive === 'boolean')
      qb = qb.andWhere('bl.isActive = :isActive', { isActive: q.isActive });
    if (q.status) qb = qb.andWhere('bl.status = :status', { status: q.status });
    if (q.licenseTypeId)
      qb = qb.andWhere('lt.id = :licenseTypeId', { licenseTypeId: q.licenseTypeId });
    if (q.healthcareFacilityId)
      qb = qb.andWhere('hf.id = :healthcareFacilityId', {
        healthcareFacilityId: q.healthcareFacilityId,
      });
    if (q.healthcareProviderId)
      qb = qb.andWhere('hp.id = :healthcareProviderId', {
        healthcareProviderId: q.healthcareProviderId,
      });
    if (q.accountId) qb = qb.andWhere('acc.id = :accountId', { accountId: q.accountId });

    qb = qb
      .orderBy(`bl.${sort}`, order)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async deleteHard(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
