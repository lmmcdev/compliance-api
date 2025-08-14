import { DataSource, FindOptionsWhere } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Address } from '../entities/address.entity';

export class AddressRepository extends BaseRepository<Address> {
  constructor(ds: DataSource) {
    super(ds, Address, { defaultOrder: { createdAt: 'DESC' }, maxPageSize: 100 });
  }

  findPagedFiltered(page = 1, pageSize = 20, where?: FindOptionsWhere<Address>) {
    return this.findPaged(page, pageSize, where);
  }
}
