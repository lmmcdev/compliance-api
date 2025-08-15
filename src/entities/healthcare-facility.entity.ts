// src/entities/healthcare-facility.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { Address } from './address.entity';

@Entity({ name: 'healthcare_facilities', schema: 'dbo' })
export class HealthcareFacility extends BaseEntity {
  /** Display name of the facility */
  @Column({ name: 'name', type: 'nvarchar', length: 256 })
  name!: string;

  /** Text location name or code */
  @Column({ name: 'location', type: 'nvarchar', length: 256, nullable: true })
  location?: string | null;

  /** Location Type: e.g., Facility, Clinic, Hospital */
  @Column({ name: 'location_type', type: 'nvarchar', length: 128, nullable: true })
  locationType?: string | null;

  /** Licensed Bed Count */
  @Column({ name: 'licensed_bed_count', type: 'int', nullable: true })
  licensedBedCount?: number | null;

  /** Reference to Account */
  @ManyToOne(() => Account, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account!: Account;

  @RelationId((hf: HealthcareFacility) => hf.account)
  accountId!: string;

  /** Facility Type: e.g., Adult Day Care */
  @Column({ name: 'facility_type', type: 'nvarchar', length: 128, nullable: true })
  facilityType?: string | null;

  /** Availability Exceptions (free text) */
  @Column({ name: 'availability_exceptions', type: 'nvarchar', length: 512, nullable: true })
  availabilityExceptions?: string | null;

  /** Always Open flag */
  @Column({ name: 'always_open', type: 'bit', default: false })
  alwaysOpen!: boolean;

  /** Source System (e.g., external integration name) */
  @Column({ name: 'source_system', type: 'nvarchar', length: 128, nullable: true })
  sourceSystem?: string | null;

  /** Source System ID (external system identifier) */
  @Column({ name: 'source_system_id', type: 'nvarchar', length: 128, nullable: true })
  sourceSystemId?: string | null;

  /** Source System Modified Date */
  @Column({ name: 'source_system_modified', type: 'datetime2', nullable: true })
  sourceSystemModified?: Date | null;

  /** Address reference if stored separately */
  @ManyToOne(() => Address, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address?: Address | null;

  @RelationId((hf: HealthcareFacility) => hf.address)
  addressId?: string | null;
}
