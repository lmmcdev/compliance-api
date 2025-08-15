import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { LicenseType } from '../entities';
import { LicenseTypeCode } from '../types/enum.type';

export class LicenseTypeRepository extends BaseRepository<LicenseType> {
  constructor(ds: DataSource) {
    super(ds, LicenseType, {
      defaultOrder: { createdAt: 'DESC' },
      maxPageSize: 50,
    });
  }

  findByCode(code: LicenseTypeCode) {
    return this.findOne({ code });
  }
}
