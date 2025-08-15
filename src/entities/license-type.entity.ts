import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'license_types', schema: 'dbo' })
export class LicenseType extends BaseEntity {
  @Index('IDX_LICENSE_TYPE_CODE', ['code'], { unique: true })
  @Column({
    name: 'code',
    type: 'nvarchar',
    length: 128,
    unique: true,
    nullable: false,
  })
  code!: string;

  @Column({ name: 'display_name', type: 'nvarchar', length: 128 })
  displayName!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
