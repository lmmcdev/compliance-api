// src/modules/account/account.doc.ts
import { BaseDoc } from '../../shared/base.doc';
import { AccountType } from '../../types';

export interface AccountDoc extends BaseDoc {
  accountNumber: string;

  name: string;
  type?: AccountType;
  phone?: string | null;
  lastCallDate?: string | null;

  billingAddressId?: string;

  terminationDateInMDVita?: string | null;
  mdvitaDisenrollment: boolean;

  patientDx?: string | null;
  diagnoses2?: string | null;
  centerManagerEmail2?: string | null;

  healthPlanInsurance?: string | null;
  payer?: string | null;

  inHouse: boolean;
  fax?: string | null;

  memberNumber?: string | null;
  plan?: string | null;
  planType?: string | null;

  numberHospitalizations?: number | null;
  physicalEvaluationLastYear?: boolean | null;
}
