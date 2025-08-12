import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Center } from './center';

@Entity()
export class Location {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ length: 128 })
  name!: string;

  @Column({ length: 128 })
  addressLine1!: string;

  @Column({ length: 128, nullable: true })
  addressLine2?: string;

  @Column({ length: 64 })
  city!: string;

  @Column({ length: 64 })
  state!: string;

  @Column({ length: 16 })
  zip!: string;

  @Column({ length: 64, default: 'US' })
  country!: string;

  @OneToMany(() => Center, (c) => c.location)
  centers!: Center[];
}
