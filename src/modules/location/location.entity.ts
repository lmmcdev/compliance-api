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

  @ManyToOne(() => LocationType, { nullable: false })
  @JoinColumn({ name: 'location_type_id' })
  locationType!: LocationType;

  @RelationId((loc: Location) => loc.locationType)
  locationTypeId!: string;

  @Column({ name: 'external_reference', type: 'nvarchar', length: 64, nullable: true })
  externalReference?: string | null;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'address_id' })
  address?: Address | null;

  @RelationId((loc: Location) => loc.address)
  addressId?: string | null;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'visitor_address_id' })
  visitorAddress?: Address | null;

  @RelationId((loc: Location) => loc.visitorAddress)
  visitorAddressId?: string | null;

  @Column({
    name: 'time_zone',
    type: 'nvarchar',
    length: 64,
    nullable: true,
    default: 'America/New_York',
  })
  timeZone?: string | null;

  @Column({ name: 'driving_directions', type: 'nvarchar', length: 1024, nullable: true })
  drivingDirections?: string | null;

  @Column({ name: 'latitude', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude?: number | null;

  @Column({ name: 'longitude', type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude?: number | null;

  @ManyToOne(() => Location, (l) => l.children, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'parent_location_id' })
  parent?: Location | null;

  @RelationId((loc: Location) => loc.parent)
  parentLocationId?: string | null;

  @OneToMany(() => Location, (l) => l.parent)
  children?: Location[];
}
