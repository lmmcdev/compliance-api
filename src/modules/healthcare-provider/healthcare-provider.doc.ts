import { BaseDoc } from '../../shared/base.doc';

export interface HealthcareProviderDoc extends BaseDoc {
  /** PK — all providers for an account live in one partition */
  accountId: string;

  healthcareProviderName: string;

  providerType?: string | null;
  providerSubtype?: string | null;
  providerClass?: string | null;
  status?: string | null;

  mdvitaHealthCareId?: string | null;
  npi?: string | null;
  practitioner?: string | null;

  autonomousAprn?: boolean; // default false
  daysOff?: string | null;

  inHouse?: boolean; // default false
  providerId?: string | null;

  pcp?: boolean; // default false
  attendingPhysician?: boolean; // default false

  /** store dates as ISO strings */
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  terminationDate?: string | null;

  totalLicensedBeds?: number | null;
  useCmsMaContractAmendment?: boolean; // default false

  /** optional FK to facilities (same account partition) */
  facilityId?: string | null;
  facilityIIId?: string | null;
  facilityIIIId?: string | null;
}
