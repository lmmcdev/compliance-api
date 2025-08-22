import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { HealthcareFacility } from './healthcare-facility.entity';
import { ListHealthcareFacilitiesQuery } from './healthcare-facility.dto';
import { PageResult } from '../../shared';

export interface IHealthcareFacilityRepository {
  createAndSave(data: Partial<HealthcareFacility>): Promise<HealthcareFacility>;
  updateAndSave(id: string, patch: Partial<HealthcareFacility>): Promise<HealthcareFacility | null>;
  findById(id: string): Promise<HealthcareFacility | null>;
  list(query: ListHealthcareFacilitiesQuery): Promise<PageResult<HealthcareFacility>>;
  deleteHard(id: string): Promise<void>;
}

export class HealthcareFacilityRepository implements IHealthcareFacilityRepository {
  private repo: Repository<HealthcareFacility>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(HealthcareFacility);
  }

  async createAndSave(data: Partial<HealthcareFacility>): Promise<HealthcareFacility> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateAndSave(
    id: string,
    patch: Partial<HealthcareFacility>,
  ): Promise<HealthcareFacility | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<HealthcareFacility | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        account: true,
        address: true,
      },
    });
  }

  async list(q: ListHealthcareFacilitiesQuery): Promise<PageResult<HealthcareFacility>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListHealthcareFacilitiesQuery['sort'], string> = {
      createdAt: 'hf.createdAt',
      updatedAt: 'hf.updatedAt',
      name: 'hf.name',
      licensedBedCount: 'hf.licensedBedCount',
      sourceSystemModified: 'hf.sourceSystemModified',
    };

    let qb: SelectQueryBuilder<HealthcareFacility> = this.repo
      .createQueryBuilder('hf')
      .leftJoinAndSelect('hf.account', 'acc')
      .leftJoinAndSelect('hf.address', 'addr');

    if (q.q) {
      qb = qb.andWhere(
        '(' +
          'hf.name LIKE :q OR ' +
          'hf.location LIKE :q OR ' +
          'hf.locationType LIKE :q OR ' +
          'hf.facilityType LIKE :q OR ' +
          'hf.sourceSystem LIKE :q OR ' +
          'hf.sourceSystemId LIKE :q OR ' +
          'hf.availabilityExceptions LIKE :q' +
          ')',
        { q: `%${q.q}%` },
      );
    }

    if (q.accountId) qb = qb.andWhere('acc.id = :accountId', { accountId: q.accountId });
    if (q.locationType)
      qb = qb.andWhere('hf.locationType = :locationType', { locationType: q.locationType });
    if (q.facilityType)
      qb = qb.andWhere('hf.facilityType = :facilityType', { facilityType: q.facilityType });
    if (typeof q.alwaysOpen === 'boolean')
      qb = qb.andWhere('hf.alwaysOpen = :alwaysOpen', { alwaysOpen: q.alwaysOpen });
    if (q.sourceSystem)
      qb = qb.andWhere('hf.sourceSystem = :sourceSystem', { sourceSystem: q.sourceSystem });

    if (q.licensedBedCountMin !== undefined) {
      qb = qb.andWhere('hf.licensedBedCount >= :licensedBedCountMin', {
        licensedBedCountMin: q.licensedBedCountMin,
      });
    }
    if (q.licensedBedCountMax !== undefined) {
      qb = qb.andWhere('hf.licensedBedCount <= :licensedBedCountMax', {
        licensedBedCountMax: q.licensedBedCountMax,
      });
    }
    if (q.sourceSystemModifiedFrom) {
      qb = qb.andWhere('hf.sourceSystemModified >= :sourceSystemModifiedFrom', {
        sourceSystemModifiedFrom: q.sourceSystemModifiedFrom,
      });
    }
    if (q.sourceSystemModifiedTo) {
      qb = qb.andWhere('hf.sourceSystemModified <= :sourceSystemModifiedTo', {
        sourceSystemModifiedTo: q.sourceSystemModifiedTo,
      });
    }

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
