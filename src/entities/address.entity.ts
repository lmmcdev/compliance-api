import { Entity, Column, Index, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from './base.entity';
import { LocationType } from './location-type.entity';

@Entity({ name: 'addresses', schema: 'dbo' })
export class Address extends BaseEntity {
  @Column({ type: 'nvarchar', length: 128 })
  street!: string;

  @Column({ type: 'nvarchar', length: 128 })
  city!: string;

  @Column({ type: 'nvarchar', length: 128, default: 'FL' })
  state!: string;

  @Column({ type: 'nvarchar', length: 10 })
  zip!: string;

  @Column({ type: 'nvarchar', length: 128, default: 'United States' })
  country!: string;

  @Column({ name: 'address_type', type: 'nvarchar', length: 20 })
  addressType!: string; // AddressType

  @Column({ name: 'driving_direction', type: 'nvarchar', length: 256, nullable: true })
  drivingDirections?: string | null;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  timeZone?: string | null;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  lead?: string | null;

  /** ---- Relationship to LocationType ---- */
  @Index('IX_addresses_location_type_id')
  @ManyToOne(() => LocationType, (lt) => lt.addresses, {
    nullable: false,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'location_type_id', referencedColumnName: 'id' })
  locationType!: LocationType;

  @RelationId((addr: Address) => addr.locationType)
  locationTypeId!: string;
}
