import { Entity, Column, Index, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../shared';
import { Address } from '../../modules/address';
import { AccountType } from '../../types';

@Entity({ name: 'accounts', schema: 'dbo' })
@Index('IX_accounts_account_number', ['accountNumber'], { unique: true })
export class Account extends BaseEntity {
  /** Top bar fields */
  @Column({ name: 'name', type: 'nvarchar', length: 256 })
  name!: string;

  @Column({ name: 'account_number', type: 'nvarchar', length: 64 })
  accountNumber!: string;

  @Column({ name: 'type', type: 'nvarchar', length: 64, nullable: true })
  type?: AccountType | string | null;

  @Column({ name: 'phone', type: 'nvarchar', length: 64, nullable: true })
  phone?: string | null;

  @Column({ name: 'last_call_date', type: 'datetime2', nullable: true })
  lastCallDate?: Date | null;

  @ManyToOne(() => Address, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'billing_address_id', referencedColumnName: 'id' })
  billingAddress?: Address | null;

  @RelationId((a: Account) => a.billingAddress)
  billingAddressId?: string | null;

  @Column({ name: 'termination_date_in_mdvita', type: 'datetime2', nullable: true })
  terminationDateInMDVita?: Date | null;

  @Column({ name: 'mdvita_disenrollment', type: 'bit', default: false })
  mdvitaDisenrollment!: boolean;

  @Column({ name: 'patient_dx', type: 'nvarchar', length: 256, nullable: true })
  patientDx?: string | null;

  @Column({ name: 'diagnoses2', type: 'nvarchar', length: 256, nullable: true })
  diagnoses2?: string | null;

  @Column({ name: 'center_manager_email_2', type: 'nvarchar', length: 256, nullable: true })
  centerManagerEmail2?: string | null;

  @Column({ name: 'health_plan_insurance', type: 'nvarchar', length: 256, nullable: true })
  healthPlanInsurance?: string | null;

  @Column({ name: 'payer', type: 'nvarchar', length: 256, nullable: true })
  payer?: string | null;

  @Column({ name: 'in_house', type: 'bit', default: false })
  inHouse!: boolean;

  @Column({ name: 'fax', type: 'nvarchar', length: 64, nullable: true })
  fax?: string | null;

  @Column({ name: 'member_number', type: 'nvarchar', length: 128, nullable: true })
  memberNumber?: string | null;

  @Column({ name: 'plan', type: 'nvarchar', length: 256, nullable: true })
  plan?: string | null;

  @Column({ name: 'plan_type', type: 'nvarchar', length: 128, nullable: true })
  planType?: string | null;

  @Column({ name: 'number_hospitalizations', type: 'int', nullable: true })
  numberHospitalizations?: number | null;

  @Column({ name: 'physical_evaluation_last_year', type: 'bit', nullable: true })
  physicalEvaluationLastYear?: boolean | null;
}
