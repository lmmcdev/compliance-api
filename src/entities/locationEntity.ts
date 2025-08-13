import { Entity, Column } from 'typeorm';
import { BaseEntity } from './baseEntity';
import { LocationType } from './enumType';

@Entity('locations')
export class Location extends BaseEntity {
  @Column({ type: 'nvarchar', length: 128 })
  name!: LocationType;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
