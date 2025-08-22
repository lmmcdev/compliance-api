import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { BusinessLicense } from './business-license.entity';
import { ListBusinessLicensesQuery } from './business-license.dtos';
import { PageResult } from '../../shared';

export interface IBusinessLicenseRepository {
  createAndSave(data: Partial<BusinessLicense>): Promise<BusinessLicense>;
  updateAndSave(id: string, patch: Partial<BusinessLicense>): Promise<BusinessLicense | null>;
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
    return this.repo.save(entity);
  }

  async updateAndSave(
    id: string,
    patch: Partial<BusinessLicense>,
  ): Promise<BusinessLicense | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
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
    if (accountId) {
      return this.repo.findOne({
        where: { licenseNumber, account: { id: accountId } },
        relations: { account: true },
      });
    }
    return this.repo.findOne({ where: { licenseNumber } });
  }

  async list(q: ListBusinessLicensesQuery): Promise<PageResult<BusinessLicense>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListBusinessLicensesQuery['sort'], string> = {
      createdAt: 'bl.createdAt',
      updatedAt: 'bl.updatedAt',
      issueDate: 'bl.issueDate',
      renewalDate: 'bl.renewalDate',
      name: 'bl.name',
      licenseNumber: 'bl.licenseNumber',
    };

    let qb: SelectQueryBuilder<BusinessLicense> = this.repo
      .createQueryBuilder('bl')
      .leftJoinAndSelect('bl.licenseType', 'lt')
      .leftJoinAndSelect('bl.healthcareFacility', 'hf')
      .leftJoinAndSelect('bl.healthcareProvider', 'hp')
      .leftJoinAndSelect('bl.account', 'acc');

    if (q.q) {
      qb = qb.andWhere(
        '(' +
          'bl.name LIKE :q OR ' +
          'bl.licenseNumber LIKE :q OR ' +
          'bl.certificateNumber LIKE :q OR ' +
          'bl.description LIKE :q' +
          ')',
        { q: `%${q.q}%` },
      );
    }

    if (q.status) qb = qb.andWhere('bl.status = :status', { status: q.status });
    if (typeof q.isActive === 'boolean')
      qb = qb.andWhere('bl.isActive = :isActive', { isActive: q.isActive });

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

    if (q.issueDateFrom)
      qb = qb.andWhere('bl.issueDate >= :issueDateFrom', { issueDateFrom: q.issueDateFrom });
    if (q.issueDateTo)
      qb = qb.andWhere('bl.issueDate <= :issueDateTo', { issueDateTo: q.issueDateTo });
    if (q.renewalDateFrom)
      qb = qb.andWhere('bl.renewalDate >= :renewalDateFrom', {
        renewalDateFrom: q.renewalDateFrom,
      });
    if (q.renewalDateTo)
      qb = qb.andWhere('bl.renewalDate <= :renewalDateTo', { renewalDateTo: q.renewalDateTo });

    qb = qb
      .orderBy(sortMap[sort], order)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async deleteHard(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
