// src/entities/healthcare-facility.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Account } from '../account';
import { Address } from '../address';

@Entity({ name: 'healthcare_facilities', schema: 'dbo' })
export class HealthcareFacility extends BaseEntity {
  @Column({ name: 'name', type: 'nvarchar', length: 256 })
  name!: string;

  @Column({ name: 'location', type: 'nvarchar', length: 256, nullable: true })
  location?: string | null;

  @Column({ name: 'location_type', type: 'nvarchar', length: 128, nullable: true })
  locationType?: string | null;

  @Column({ name: 'licensed_bed_count', type: 'int', nullable: true })
  licensedBedCount?: number | null;

  @ManyToOne(() => Account, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account!: Account;

  @RelationId((hf: HealthcareFacility) => hf.account)
  accountId!: string;

  @Column({ name: 'facility_type', type: 'nvarchar', length: 128, nullable: true })
  facilityType?: string | null;

  @Column({ name: 'availability_exceptions', type: 'nvarchar', length: 512, nullable: true })
  availabilityExceptions?: string | null;

  @Column({ name: 'always_open', type: 'bit', default: false })
  alwaysOpen?: boolean;

  @Column({ name: 'source_system', type: 'nvarchar', length: 128, nullable: true })
  sourceSystem?: string | null;

  @Column({ name: 'source_system_id', type: 'nvarchar', length: 128, nullable: true })
  sourceSystemId?: string | null;

  @Column({ name: 'source_system_modified', type: 'datetime2', nullable: true })
  sourceSystemModified?: Date | null;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address?: Address | null;

  @RelationId((hf: HealthcareFacility) => hf.address)
  addressId?: string | null;
}
