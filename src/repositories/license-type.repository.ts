import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { LicenseType } from '../entities/license-type.entity';

export class LicenseTypeRepository extends BaseRepository<LicenseType> {
  constructor(ds: DataSource) {
    super(ds, LicenseType, {
      defaultOrder: { createdAt: 'DESC' },
      maxPageSize: 50,
    });
  }
}
