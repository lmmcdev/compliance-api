// src/modules/business-license/business-license.doc.ts
import { BaseDoc } from '../../shared/base.doc';
import { JurisdictionType, LicenseStatus } from '../../types';

export interface BusinessLicenseDoc extends BaseDoc {
  /** Partition key */
  accountId: string;

  name: string;

  issueDate?: string | null; // ISO
  renewalDate?: string | null; // ISO
  terminationDate?: string | null; // ISO
  licenseNumber?: string | null;
  certificateNumber?: string | null;

  status?: LicenseStatus | string | null;
  isActive?: boolean; // default false

  description?: string | null;

  licenseTypeId?: string | null;

  healthcareProviderId?: string | null;
  healthcareFacilityId?: string | null;
  healthcareFacilityId2?: string | null;

  jurisdictionType?: JurisdictionType | string | null;
  jurisdictionOther?: string | null;
}
