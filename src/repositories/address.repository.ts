// src/repositories/address.repository.ts
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Address } from '../entities/address.entity';
import { ListAddressesQuery } from '../dtos/address.dto';
import { PageResult } from '../dtos/pagination';

export interface IAddressRepository {
  createAndSave(data: Partial<Address>): Promise<Address>;
  updateAndSave(id: string, patch: Partial<Address>): Promise<Address | null>;
  findById(id: string): Promise<Address | null>;
  list(query: ListAddressesQuery): Promise<PageResult<Address>>;
  deleteHard(id: string): Promise<void>;
}

export class AddressRepository implements IAddressRepository {
  private repo: Repository<Address>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(Address);
  }

  async createAndSave(data: Partial<Address>): Promise<Address> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<Address>): Promise<Address | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<Address | null> {
    return this.repo.findOne({
      where: { id },
      relations: { locationType: true },
    });
  }

  async list(q: ListAddressesQuery): Promise<PageResult<Address>> {
    const { page, pageSize, sort, order } = q;

    const sortMap: Record<ListAddressesQuery['sort'], string> = {
      createdAt: 'ad.createdAt',
      updatedAt: 'ad.updatedAt',
      city: 'ad.city',
      state: 'ad.state',
      zip: 'ad.zip',
      country: 'ad.country',
      addressType: 'ad.addressType',
    };

    let qb: SelectQueryBuilder<Address> = this.repo
      .createQueryBuilder('ad')
      .leftJoinAndSelect('ad.locationType', 'lt');

    if (q.q) {
      qb = qb.andWhere(
        '(' +
          'ad.street LIKE :q OR ' +
          'ad.city LIKE :q OR ' +
          'ad.state LIKE :q OR ' +
          'ad.zip LIKE :q OR ' +
          'ad.country LIKE :q OR ' +
          'ad.addressType LIKE :q OR ' +
          'ad.description LIKE :q OR ' +
          'ad.timeZone LIKE :q OR ' +
          'ad.lead LIKE :q' +
          ')',
        { q: `%${q.q}%` },
      );
    }

    if (q.city) qb = qb.andWhere('ad.city = :city', { city: q.city });
    if (q.state) qb = qb.andWhere('ad.state = :state', { state: q.state });
    if (q.zip) qb = qb.andWhere('ad.zip = :zip', { zip: q.zip });
    if (q.country) qb = qb.andWhere('ad.country = :country', { country: q.country });
    if (q.addressType)
      qb = qb.andWhere('ad.addressType = :addressType', { addressType: q.addressType });
    if (q.locationTypeId)
      qb = qb.andWhere('lt.id = :locationTypeId', { locationTypeId: q.locationTypeId });

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
