// src/modules/business-license/business-license.doc.ts
import { BaseDoc } from '../../shared/base.doc';

export type BusinessLicenseStatus = 'Completed' | 'Active' | 'Inactive' | 'Pending';

export interface BusinessLicenseDoc extends BaseDoc {
  /** Partition key */
  accountId: string;

  name: string;

  issueDate?: string | null; // ISO
  renewalDate?: string | null; // ISO
  terminationDate?: string | null; // ISO

  licenseNumber?: string | null;
  certificateNumber?: string | null;

  status?: BusinessLicenseStatus | string | null;
  isActive?: boolean; // default false

  description?: string | null;

  licenseTypeId?: string | null;
  healthcareFacilityId?: string | null;
  healthcareProviderId?: string | null;
}
