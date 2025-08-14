import { BaseEntity } from './base.entity';
import { Entity, Column } from 'typeorm';
import { LicenseStatus } from './enum.type';

@Entity('licenses')
export class License extends BaseEntity {
  // number
  @Column({ type: 'int', nullable: false })
  number!: number;

  @Column({ type: 'nvarchar', length: 256 })
  primaryName!: string;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  dbaName?: string;

  // Issued Date
  @Column({ type: 'datetime', nullable: true })
  issuedDate?: Date | null;

  // Renewal Date
  @Column({ type: 'datetime', nullable: true })
  renewalDate?: Date | null;

  // Expiration Date
  @Column({ type: 'datetime', nullable: true })
  expirationDate?: Date | null;

  // status
  @Column({ type: 'nvarchar', length: 256, nullable: true })
  status?: LicenseStatus | null;

  // is active
  @Column({ type: 'bit', default: () => '0' })
  isActive?: boolean;

  // health care provider id
  @Column({ type: 'uniqueidentifier', nullable: true })
  healthCareProviderId?: string | null;

  // health care facility
  @Column({ type: 'uniqueidentifier', nullable: true })
  healthCareFacilityId?: string | null;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  healthCareProviderName?: string | null;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
