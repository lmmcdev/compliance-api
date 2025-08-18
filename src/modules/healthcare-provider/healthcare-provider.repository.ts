// src/repositories/healthcare-provider.repository.ts
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { HealthcareProvider } from './healthcare-provider.entity';
import { ListHealthcareProvidersQuery } from './healthcare-provider.dtos';
import { PageResult } from '../../shared';

export interface IHealthcareProviderRepository {
  createAndSave(data: Partial<HealthcareProvider>): Promise<HealthcareProvider>;
  updateAndSave(id: string, patch: Partial<HealthcareProvider>): Promise<HealthcareProvider | null>;
  findById(id: string): Promise<HealthcareProvider | null>;
  findByNpi(npi: string, accountId?: string): Promise<HealthcareProvider | null>;
  list(query: ListHealthcareProvidersQuery): Promise<PageResult<HealthcareProvider>>;
  deleteHard(id: string): Promise<void>;
}

export class HealthcareProviderRepository implements IHealthcareProviderRepository {
  private repo: Repository<HealthcareProvider>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(HealthcareProvider);
  }

  async createAndSave(data: Partial<HealthcareProvider>): Promise<HealthcareProvider> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateAndSave(
    id: string,
    patch: Partial<HealthcareProvider>,
  ): Promise<HealthcareProvider | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<HealthcareProvider | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        account: true,
        facility: true,
        facilityII: true,
        facilityIII: true,
      },
    });
  }

  async findByNpi(npi: string, accountId?: string): Promise<HealthcareProvider | null> {
    const qb = this.repo
      .createQueryBuilder('hp')
      .leftJoinAndSelect('hp.account', 'acc')
      .where('hp.npi = :npi', { npi });

    if (accountId) qb.andWhere('acc.id = :accountId', { accountId });

    return qb.getOne();
  }

  async list(q: ListHealthcareProvidersQuery): Promise<PageResult<HealthcareProvider>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListHealthcareProvidersQuery['sort'], string> = {
      createdAt: 'hp.createdAt',
      updatedAt: 'hp.updatedAt',
      healthcareProviderName: 'hp.healthcareProviderName',
      npi: 'hp.npi',
      effectiveFrom: 'hp.effectiveFrom',
      effectiveTo: 'hp.effectiveTo',
    };

    let qb: SelectQueryBuilder<HealthcareProvider> = this.repo
      .createQueryBuilder('hp')
      .leftJoinAndSelect('hp.account', 'acc')
      .leftJoinAndSelect('hp.facility', 'f1')
      .leftJoinAndSelect('hp.facilityII', 'f2')
      .leftJoinAndSelect('hp.facilityIII', 'f3');

    // Free-text search
    if (q.q) {
      qb = qb.andWhere(
        '(' +
          'hp.healthcareProviderName LIKE :q OR ' +
          'hp.npi LIKE :q OR ' +
          'hp.providerType LIKE :q OR ' +
          'hp.providerSubtype LIKE :q OR ' +
          'hp.providerClass LIKE :q OR ' +
          'hp.practitioner LIKE :q OR ' +
          'hp.providerId LIKE :q OR ' +
          'hp.status LIKE :q OR ' +
          'hp.mdvitaHealthCareId LIKE :q' +
          ')',
        { q: `%${q.q}%` },
      );
    }

    // Scalar filters
    if (q.accountId) qb = qb.andWhere('acc.id = :accountId', { accountId: q.accountId });
    if (q.status) qb = qb.andWhere('hp.status = :status', { status: q.status });
    if (q.providerType)
      qb = qb.andWhere('hp.providerType = :providerType', { providerType: q.providerType });
    if (q.providerSubtype)
      qb = qb.andWhere('hp.providerSubtype = :providerSubtype', {
        providerSubtype: q.providerSubtype,
      });
    if (q.providerClass)
      qb = qb.andWhere('hp.providerClass = :providerClass', { providerClass: q.providerClass });
    if (q.npi) qb = qb.andWhere('hp.npi = :npi', { npi: q.npi });
    if (q.practitioner)
      qb = qb.andWhere('hp.practitioner = :practitioner', { practitioner: q.practitioner });

    // Boolean filters
    if (typeof q.autonomousAprn === 'boolean')
      qb = qb.andWhere('hp.autonomousAprn = :autonomousAprn', { autonomousAprn: q.autonomousAprn });
    if (typeof q.inHouse === 'boolean')
      qb = qb.andWhere('hp.inHouse = :inHouse', { inHouse: q.inHouse });
    if (typeof q.pcp === 'boolean') qb = qb.andWhere('hp.pcp = :pcp', { pcp: q.pcp });
    if (typeof q.attendingPhysician === 'boolean')
      qb = qb.andWhere('hp.attendingPhysician = :attendingPhysician', {
        attendingPhysician: q.attendingPhysician,
      });
    if (typeof q.useCmsMaContractAmendment === 'boolean') {
      qb = qb.andWhere('hp.useCmsMaContractAmendment = :useCms', {
        useCms: q.useCmsMaContractAmendment,
      });
    }

    // Facility filters
    if (q.facilityId) qb = qb.andWhere('f1.id = :facilityId', { facilityId: q.facilityId });
    if (q.facilityIIId) qb = qb.andWhere('f2.id = :facilityIIId', { facilityIIId: q.facilityIIId });
    if (q.facilityIIIId)
      qb = qb.andWhere('f3.id = :facilityIIIId', { facilityIIIId: q.facilityIIIId });

    // Date ranges
    if (q.effectiveFromFrom)
      qb = qb.andWhere('hp.effectiveFrom >= :effFromFrom', { effFromFrom: q.effectiveFromFrom });
    if (q.effectiveFromTo)
      qb = qb.andWhere('hp.effectiveFrom <= :effFromTo', { effFromTo: q.effectiveFromTo });
    if (q.effectiveToFrom)
      qb = qb.andWhere('hp.effectiveTo >= :effToFrom', { effToFrom: q.effectiveToFrom });
    if (q.effectiveToTo)
      qb = qb.andWhere('hp.effectiveTo <= :effToTo', { effToTo: q.effectiveToTo });
    if (q.terminationDateFrom)
      qb = qb.andWhere('hp.terminationDate >= :termFrom', { termFrom: q.terminationDateFrom });
    if (q.terminationDateTo)
      qb = qb.andWhere('hp.terminationDate <= :termTo', { termTo: q.terminationDateTo });

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
