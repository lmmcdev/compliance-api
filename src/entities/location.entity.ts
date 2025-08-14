import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { LocationType } from './location-type.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @Column({ type: 'nvarchar', length: 128 })
  name!: string;

  @Column({ type: 'nvarchar', length: 256, nullable: true })
  description?: string | null;
}
