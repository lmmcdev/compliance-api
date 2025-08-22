import { z } from 'zod';
import { AccountType } from '../../types';

export const AccountTypeSchema = z.enum(AccountType).or(z.string()).optional().nullable();

export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(256),
  accountNumber: z.string().min(1).max(64),

  type: AccountTypeSchema,
  phone: z.string().max(64).optional().nullable(),
  lastCallDate: z.coerce.date().optional().nullable(),

  billingAddressId: z.uuid().optional().nullable(),

  terminationDateInMDVita: z.coerce.date().optional().nullable(),
  mdvitaDisenrollment: z.boolean().optional(),
  patientDx: z.string().max(256).optional().nullable(),
  diagnoses2: z.string().max(256).optional().nullable(),
  centerManagerEmail2: z.email().max(256).optional().nullable(),
  healthPlanInsurance: z.string().max(256).optional().nullable(),
  payer: z.string().max(256).optional().nullable(),
  inHouse: z.boolean().optional(),
  fax: z.string().max(64).optional().nullable(),
  memberNumber: z.string().max(128).optional().nullable(),
  plan: z.string().max(256).optional().nullable(),
  planType: z.string().max(128).optional().nullable(),
  numberHospitalizations: z.number().int().optional().nullable(),
  physicalEvaluationLastYear: z.boolean().optional().nullable(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;

export const ListAccountsSchema = z.object({
  q: z.string().optional(),
  accountNumber: z.string().optional(),
  type: z.string().optional(),
  inHouse: z.coerce.boolean().optional(),
  mdvitaDisenrollment: z.coerce.boolean().optional(),
  payer: z.string().optional(),
  planType: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'updatedAt', 'name', 'accountNumber', 'lastCallDate'])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});
export type ListAccountsQuery = z.infer<typeof ListAccountsSchema>;

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
