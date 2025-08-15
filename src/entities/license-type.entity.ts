// src/entities/license-type.entity.ts
import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BusinessLicense } from './business-license.entity';

@Entity({ name: 'license_types', schema: 'dbo' })
@Index('UQ_license_types_code', ['code'], { unique: true })
export class LicenseType extends BaseEntity {
  @Column({ name: 'code', type: 'nvarchar', length: 64 }) // e.g., "AHCA"
  code!: string;

  @Column({ name: 'display_name', type: 'nvarchar', length: 256, nullable: true })
  displayName?: string | null;

  @Column({ name: 'description', type: 'nvarchar', length: 512, nullable: true })
  description?: string | null;

  @OneToMany(() => BusinessLicense, (bl) => bl.licenseType)
  businessLicenses!: BusinessLicense[];
}
