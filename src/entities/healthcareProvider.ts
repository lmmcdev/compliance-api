import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { License } from './license';

@Entity()
export class HealthcareProvider {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 128 })
  fullName!: string;

  @Column({ length: 32, unique: true })
  npi!: string;

  @OneToMany(() => License, (lic) => lic.provider)
  licenses!: License[];
}
