import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Address } from './address.entity';

export enum LocationTypeCode {
  CORPORATE = 'Corporate',
  DENTAL = 'Dental',
  GYM = 'Gym',
  PHYSICAL_THERAPY = 'Physical Therapy',
  PRIMARY_CARE = 'Primary Care',
  SPECIALTY = 'Specialty',
  SALES = 'Sales',
  PHARMACY = 'Pharmacy',
  ADULT_DAY_CARE = 'Adult Day Care',
  OPTICAL = 'Optical',
  OTHER = 'Other',
}

@Entity({ name: 'location_types', schema: 'dbo' })
export class LocationType extends BaseEntity {
  @Column({ name: 'code', type: 'nvarchar', length: 128, enum: LocationTypeCode })
  code!: LocationTypeCode;

  @Column({ name: 'display_name', type: 'nvarchar', length: 128 })
  displayName!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;

  /** Inverse relation */
  @OneToMany(() => Address, (addr) => addr.locationType)
  addresses!: Address[];
}
