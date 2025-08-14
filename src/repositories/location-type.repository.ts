import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { LocationType, LocationTypeCode } from '../entities/location-type.entity';

export class LocationTypeRepository extends BaseRepository<LocationType> {
  constructor(ds: DataSource) {
    super(ds, LocationType, { defaultOrder: { createdAt: 'DESC' } });
  }

  findByCode(code: LocationTypeCode) {
    return this.findOne({ code });
  }
}
