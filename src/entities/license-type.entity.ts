import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'license_types', schema: 'dbo' })
export class LicenseType extends BaseEntity {
  @Column({
    name: 'code',
    type: 'nvarchar',
    length: 128,
  })
  code!: string; // LicenseTypeCode

  @Column({ name: 'display_name', type: 'nvarchar', length: 128 })
  displayName!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
