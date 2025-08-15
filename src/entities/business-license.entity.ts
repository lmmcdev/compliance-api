// src/entities/business-license.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, RelationId, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { LicenseType } from './license-type.entity';
import { HealthcareFacility } from './healthcare-facility.entity';
import { HealthcareProvider } from './healthcare-provider.entity';
import { Account } from './account.entity';

export enum BusinessLicenseStatus {
  COMPLETED = 'Completed',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
}

@Entity({ name: 'business_licenses', schema: 'dbo' })
@Index('IX_business_licenses_license_number', ['licenseNumber'])
export class BusinessLicense extends BaseEntity {
  /** Name shown at top (e.g., AHCA-12115) */
  @Column({ name: 'name', type: 'nvarchar', length: 256 })
  name!: string;

  /** Dates */
  @Column({ name: 'issue_date', type: 'datetime2', nullable: true })
  issueDate?: Date | null;

  @Column({ name: 'renewal_date', type: 'datetime2', nullable: true })
  renewalDate?: Date | null;

  @Column({ name: 'termination_date', type: 'datetime2', nullable: true })
  terminationDate?: Date | null;

  /** Numbers */
  @Column({ name: 'license_number', type: 'nvarchar', length: 128, nullable: true })
  licenseNumber?: string | null;

  @Column({ name: 'certificate_number', type: 'nvarchar', length: 128, nullable: true })
  certificateNumber?: string | null;

  /** Status + Activity */
  @Column({ name: 'status', type: 'nvarchar', length: 64, nullable: true })
  status?: BusinessLicenseStatus | string | null;

  @Column({ name: 'is_active', type: 'bit', default: false })
  isActive!: boolean;

  /** Optional description */
  @Column({ name: 'description', type: 'nvarchar', length: 1024, nullable: true })
  description?: string | null;

  /** Relations */
  @ManyToOne(() => LicenseType, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'license_type_id', referencedColumnName: 'id' })
  licenseType?: LicenseType | null;
  @RelationId((b: BusinessLicense) => b.licenseType)
  licenseTypeId?: string | null;

  @ManyToOne(() => HealthcareFacility, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'healthcare_facility_id', referencedColumnName: 'id' })
  healthcareFacility?: HealthcareFacility | null;
  @RelationId((b: BusinessLicense) => b.healthcareFacility)
  healthcareFacilityId?: string | null;

  @ManyToOne(() => HealthcareProvider, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'healthcare_provider_id', referencedColumnName: 'id' })
  healthcareProvider?: HealthcareProvider | null;
  @RelationId((b: BusinessLicense) => b.healthcareProvider)
  healthcareProviderId?: string | null;

  /** Optional: tie back to Account if you want a direct link */
  @ManyToOne(() => Account, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account?: Account | null;
  @RelationId((b: BusinessLicense) => b.account)
  accountId?: string | null;
}
