// src/modules/account/account.dto.ts
import { z } from 'zod';
import { AccountType } from '../../types';

export const CreateAccountSchema = z.object({
  // accountNumber unique identifier for the account

  accountNumber: z.string().min(1).toUpperCase(),
  name: z.string().min(1).toUpperCase(),

  type: z.enum(AccountType).nullable().optional(),
  phone: z.string().nullable().optional(),
  lastCallDate: z.iso.datetime().nullable().optional(),

  billingAddressId: z.uuid().nullable().optional(),

  terminationDateInMDVita: z.iso.datetime().nullable().optional(),
  mdvitaDisenrollment: z.boolean().default(false),

  patientDx: z.string().nullable().optional(),
  diagnoses2: z.string().nullable().optional(),
  centerManagerEmail2: z.email().nullable().optional(),

  healthPlanInsurance: z.string().nullable().optional(),
  payer: z.string().nullable().optional(),

  inHouse: z.boolean().default(false),
  fax: z.string().nullable().optional(),

  memberNumber: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  planType: z.string().nullable().optional(),

  numberHospitalizations: z.number().int().nullable().optional(),
  physicalEvaluationLastYear: z.boolean().nullable().optional(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  accountNumber: z.string().min(1),
});

export const ListAccountsSchema = z.object({
  accountNumber: z.string().optional(),
  q: z.string().optional(),
  plan: z.string().optional(),
  payer: z.string().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
});
