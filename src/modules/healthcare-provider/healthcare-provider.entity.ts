import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../../shared';
import { Account } from '../account';
import { HealthcareFacility } from '../healthcare-facility';

@Entity({ name: 'healthcare_providers', schema: 'dbo' })
export class HealthcareProvider extends BaseEntity {
  /** Provider name */
  @Column({ name: 'healthcare_provider_name', type: 'nvarchar', length: 256 })
  healthcareProviderName!: string;

  /** Reference to Account */
  @ManyToOne(() => Account, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account!: Account;

  @RelationId((hp: HealthcareProvider) => hp.account)
  accountId!: string;

  /** Provider Type (e.g., Medical Doctor (MD)) */
  @Column({ name: 'provider_type', type: 'nvarchar', length: 128, nullable: true })
  providerType?: string | null;

  /** Provider Subtype */
  @Column({ name: 'provider_subtype', type: 'nvarchar', length: 128, nullable: true })
  providerSubtype?: string | null;

  /** Provider Class */
  @Column({ name: 'provider_class', type: 'nvarchar', length: 128, nullable: true })
  providerClass?: string | null;

  /** Status (e.g., Active, Inactive) */
  @Column({ name: 'status', type: 'nvarchar', length: 64, nullable: true })
  status?: string | null;

  /** MDVita HealthCare ID */
  @Column({ name: 'mdvita_healthcare_id', type: 'nvarchar', length: 64, nullable: true })
  mdvitaHealthCareId?: string | null;

  /** NPI (National Provider Identifier) */
  @Column({ name: 'npi', type: 'nvarchar', length: 64, nullable: true })
  npi?: string | null;

  /** Practitioner name if different from provider name */
  @Column({ name: 'practitioner', type: 'nvarchar', length: 256, nullable: true })
  practitioner?: string | null;

  /** Autonomous APRN flag or info */
  @Column({ name: 'autonomous_aprn', type: 'bit', default: false })
  autonomousAprn!: boolean;

  /** Days off description or notes */
  @Column({ name: 'days_off', type: 'nvarchar', length: 256, nullable: true })
  daysOff?: string | null;

  /** In-house flag */
  @Column({ name: 'in_house', type: 'bit', default: false })
  inHouse!: boolean;

  /** Provider ID */
  @Column({ name: 'provider_id', type: 'nvarchar', length: 128, nullable: true })
  providerId?: string | null;

  /** PCP flag */
  @Column({ name: 'pcp', type: 'bit', default: false })
  pcp!: boolean;

  /** Attending Physician flag */
  @Column({ name: 'attending_physician', type: 'bit', default: false })
  attendingPhysician!: boolean;

  /** Dates */
  @Column({ name: 'effective_from', type: 'datetime2', nullable: true })
  effectiveFrom?: Date | null;

  @Column({ name: 'effective_to', type: 'datetime2', nullable: true })
  effectiveTo?: Date | null;

  @Column({ name: 'termination_date', type: 'datetime2', nullable: true })
  terminationDate?: Date | null;

  /** Total Licensed Beds */
  @Column({ name: 'total_licensed_beds', type: 'int', nullable: true })
  totalLicensedBeds?: number | null;

  /** CMS MA Contract Amendment flag */
  @Column({ name: 'use_cms_ma_contract_amendment', type: 'bit', default: false })
  useCmsMaContractAmendment!: boolean;

  /** Facilities — multiple possible links */
  @ManyToOne(() => HealthcareFacility, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'facility_id', referencedColumnName: 'id' })
  facility?: HealthcareFacility | null;

  @RelationId((hp: HealthcareProvider) => hp.facility)
  facilityId?: string | null;

  @ManyToOne(() => HealthcareFacility, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'facility_ii_id', referencedColumnName: 'id' })
  facilityII?: HealthcareFacility | null;

  @RelationId((hp: HealthcareProvider) => hp.facilityII)
  facilityIIId?: string | null;

  @ManyToOne(() => HealthcareFacility, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'facility_iii_id', referencedColumnName: 'id' })
  facilityIII?: HealthcareFacility | null;

  @RelationId((hp: HealthcareProvider) => hp.facilityIII)
  facilityIIIId?: string | null;
}
