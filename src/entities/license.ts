import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { HealthcareProvider } from './healthcareProvider';
import { Center } from './center';

export type LicenseType = 'DOCTOR' | 'BUILDING' | 'ELEVATOR' | 'OTHER';

@Entity()
@Index(['licenseType', 'number'], { unique: true }) // prevent duplicates by type+number
export class License {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  licenseType!: LicenseType;

  @Column({ length: 64 })
  number!: string;

  @Column({ type: 'date' })
  issueDate!: string; // YYYY-MM-DD

  @Column({ type: 'date' })
  expiryDate!: string; // YYYY-MM-DD

  @ManyToOne(() => HealthcareProvider, (p) => p.licenses, { nullable: true, onDelete: 'SET NULL' })
  provider!: HealthcareProvider | null;

  @ManyToOne(() => Center, (c) => c.licenses, { nullable: true, onDelete: 'SET NULL' })
  center!: Center | null;
}
