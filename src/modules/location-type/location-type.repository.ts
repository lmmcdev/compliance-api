import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { LocationType } from './location-type.entity';
import { ListLocationTypesQuery } from './location-type.dto';
import { PageResult } from '../../shared';

export interface ILocationTypeRepository {
  createAndSave(data: Partial<LocationType>): Promise<LocationType>;
  updateAndSave(id: string, patch: Partial<LocationType>): Promise<LocationType | null>;
  findById(id: string): Promise<LocationType | null>;
  findByCode(code: string): Promise<LocationType | null>;
  list(query: ListLocationTypesQuery): Promise<PageResult<LocationType>>;
  deleteHard(id: string): Promise<void>;
}

export class LocationTypeRepository implements ILocationTypeRepository {
  private repo: Repository<LocationType>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(LocationType);
  }

  async createAndSave(data: Partial<LocationType>): Promise<LocationType> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<LocationType>): Promise<LocationType | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<LocationType | null> {
    return this.repo.findOne({
      where: { id },
      relations: { addresses: true },
    });
  }

  async findByCode(code: string): Promise<LocationType | null> {
    return this.repo.findOne({ where: { code } });
  }

  async list(q: ListLocationTypesQuery): Promise<PageResult<LocationType>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListLocationTypesQuery['sort'], string> = {
      createdAt: 'lt.createdAt',
      updatedAt: 'lt.updatedAt',
      code: 'lt.code',
      displayName: 'lt.displayName',
    };

    let qb: SelectQueryBuilder<LocationType> = this.repo
      .createQueryBuilder('lt')
      .leftJoinAndSelect('lt.addresses', 'ad');

    if (q.q) {
      qb = qb.andWhere('(lt.code LIKE :q OR lt.displayName LIKE :q OR lt.description LIKE :q)', {
        q: `%${q.q}%`,
      });
    }
    if (q.code) qb = qb.andWhere('lt.code = :code', { code: q.code });
    if (q.displayName)
      qb = qb.andWhere('lt.displayName = :displayName', { displayName: q.displayName });

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
