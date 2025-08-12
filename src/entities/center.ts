import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from './location';
import { License } from './license';

@Entity()
export class Center {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 128 })
  name!: string;

  @ManyToOne(() => Location, (l) => l.centers, { nullable: false, onDelete: 'CASCADE' })
  location!: Location;

  @OneToMany(() => License, (lic) => lic.center)
  licenses!: License[];
}
