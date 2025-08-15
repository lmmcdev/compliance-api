import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { LocationType } from '../entities/location-type.entity';
import { LocationTypeCode } from '../types/enum.type';

export class LocationTypeRepository extends BaseRepository<LocationType> {
  constructor(ds: DataSource) {
    super(ds, LocationType, { defaultOrder: { createdAt: 'DESC' } });
  }

  findByCode(code: LocationTypeCode) {
    return this.findOne({ code });
  }
}
