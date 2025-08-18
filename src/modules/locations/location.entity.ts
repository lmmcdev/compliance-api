import { Entity, Column, ManyToOne, OneToMany, JoinColumn, RelationId, Index } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { LocationType } from '../location-type/location-type.entity';
import { Address } from '../address/address.entity';

@Entity({ name: 'locations', schema: 'dbo' })
@Index('IX_Locations_Name', ['name'])
export class Location extends BaseEntity {
  @Column({ name: 'name', type: 'nvarchar', length: 128 })
  name!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;

  /** Location Type (e.g., Primary Care) */
  @ManyToOne(() => LocationType, { nullable: false })
  @JoinColumn({ name: 'location_type_id' })
  locationType!: LocationType;

  @RelationId((loc: Location) => loc.locationType)
  locationTypeId!: string;

  /** External Reference (e.g., Salesforce/legacy code) */
  @Column({ name: 'external_reference', type: 'nvarchar', length: 64, nullable: true })
  externalReference?: string | null;

  /** Physical Address */
  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'address_id' })
  address?: Address | null;

  @RelationId((loc: Location) => loc.address)
  addressId?: string | null;

  /** Visitor Address (separate address record if used) */
  @ManyToOne(() => Address, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'visitor_address_id' })
  visitorAddress?: Address | null;

  @RelationId((loc: Location) => loc.visitorAddress)
  visitorAddressId?: string | null;

  /** Time zone (store IANA like "America/New_York") */
  @Column({
    name: 'time_zone',
    type: 'nvarchar',
    length: 64,
    nullable: true,
    default: 'America/New_York',
  })
  timeZone?: string | null;

  /** Driving directions / notes */
  @Column({ name: 'driving_directions', type: 'nvarchar', length: 1024, nullable: true })
  drivingDirections?: string | null;

  /** Geo position (from "Location" field) */
  @Column({ name: 'latitude', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude?: number | null;

  @Column({ name: 'longitude', type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude?: number | null;

  /** Parent Location (for hierarchies) */
  @ManyToOne(() => Location, (l) => l.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_location_id' })
  parent?: Location | null;

  @RelationId((loc: Location) => loc.parent)
  parentLocationId?: string | null;

  @OneToMany(() => Location, (l) => l.parent)
  children?: Location[];
}
