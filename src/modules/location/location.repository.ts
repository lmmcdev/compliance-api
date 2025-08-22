
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Location } from './location.entity';
import { ListLocationsQuery } from './location.dtos';
import { PageResult } from '../../shared';

export interface ILocationRepository {
  createAndSave(data: Partial<Location>): Promise<Location>;
  updateAndSave(id: string, patch: Partial<Location>): Promise<Location | null>;
  findById(id: string): Promise<Location | null>;
  findByName(name: string): Promise<Location | null>;
  list(query: ListLocationsQuery): Promise<PageResult<Location>>;
  deleteHard(id: string): Promise<void>;
}

export class LocationRepository implements ILocationRepository {
  private repo: Repository<Location>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(Location);
  }

  async createAndSave(data: Partial<Location>): Promise<Location> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<Location>): Promise<Location | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<Location | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        locationType: true,
        address: true,
        visitorAddress: true,
        parent: true,
      },
    });
  }

  async findByName(name: string): Promise<Location | null> {
    return this.repo.findOne({ where: { name } });
  }

  async list(q: ListLocationsQuery): Promise<PageResult<Location>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListLocationsQuery['sort'], string> = {
      createdAt: 'l.createdAt',
      updatedAt: 'l.updatedAt',
      name: 'l.name',
    };

    let qb: SelectQueryBuilder<Location> = this.repo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.locationType', 'lt')
      .leftJoinAndSelect('l.address', 'ad')
      .leftJoinAndSelect('l.visitorAddress', 'vad')
      .leftJoinAndSelect('l.parent', 'pl');


    if (q.q) {
      qb = qb.andWhere(
        '(l.name LIKE :q OR l.description LIKE :q OR l.externalReference LIKE :q OR l.timeZone LIKE :q)',
        { q: `%${q.q}%` },
      );
    }

    if (q.name) qb = qb.andWhere('l.name = :name', { name: q.name });
    if (q.locationTypeId)
      qb = qb.andWhere('lt.id = :locationTypeId', { locationTypeId: q.locationTypeId });
    if (q.parentLocationId)
      qb = qb.andWhere('pl.id = :parentLocationId', { parentLocationId: q.parentLocationId });
    if (q.addressId) qb = qb.andWhere('ad.id = :addressId', { addressId: q.addressId });
    if (q.visitorAddressId)
      qb = qb.andWhere('vad.id = :visitorAddressId', { visitorAddressId: q.visitorAddressId });
    if (typeof q.hasVisitorAddress !== 'undefined') {
      qb = q.hasVisitorAddress ? qb.andWhere('vad.id IS NOT NULL') : qb.andWhere('vad.id IS NULL');
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
