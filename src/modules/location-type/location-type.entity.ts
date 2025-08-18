import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Address } from '../../modules/address';

@Entity({ name: 'location_types', schema: 'dbo' })
export class LocationType extends BaseEntity {
  @Column({ name: 'code', type: 'nvarchar', length: 128 })
  code!: string;

  @Column({ name: 'display_name', type: 'nvarchar', length: 128 })
  displayName!: string;

  @Column({ name: 'description', type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;

  @OneToMany(() => Address, (addr) => addr.locationType)
  addresses!: Address[];
}
