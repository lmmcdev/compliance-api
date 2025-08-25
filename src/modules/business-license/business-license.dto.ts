import { z } from 'zod';
import { BusinessLicenseStatus } from './business-license.entity';

export const BusinessLicenseStatusSchema = z
  .enum(BusinessLicenseStatus)
  .or(z.string().min(1))
  .optional()
  .nullable();

export const CreateBusinessLicenseSchema = z.object({
  name: z.string().min(1).max(256),

  issueDate: z.coerce.date().optional().nullable(),
  renewalDate: z.coerce.date().optional().nullable(),
  terminationDate: z.coerce.date().optional().nullable(),

  licenseNumber: z.string().max(128).optional().nullable(),
  certificateNumber: z.string().max(128).optional().nullable(),

  status: BusinessLicenseStatusSchema,
  isActive: z.boolean().optional(),

  description: z.string().max(1024).optional().nullable(),

  licenseTypeId: z.uuid().optional().nullable(),
  healthcareFacilityId: z.uuid().optional().nullable(),
  healthcareProviderId: z.uuid().optional().nullable(),
  accountId: z.uuid().optional().nullable(),
});

export const UpdateBusinessLicenseSchema = CreateBusinessLicenseSchema.partial();

export type CreateBusinessLicenseDto = z.infer<typeof CreateBusinessLicenseSchema>;
export type UpdateBusinessLicenseDto = z.infer<typeof UpdateBusinessLicenseSchema>;

export const ListBusinessLicensesSchema = z.object({
  q: z.string().optional(),

  status: z.string().optional(),
  isActive: z.coerce.boolean().optional(),

  licenseTypeId: z.uuid().optional(),
  healthcareFacilityId: z.uuid().optional(),
  healthcareProviderId: z.uuid().optional(),
  accountId: z.uuid().optional(),

  issueDateFrom: z.coerce.date().optional(),
  issueDateTo: z.coerce.date().optional(),
  renewalDateFrom: z.coerce.date().optional(),
  renewalDateTo: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'updatedAt', 'issueDate', 'renewalDate', 'name', 'licenseNumber'])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListBusinessLicensesQuery = z.infer<typeof ListBusinessLicensesSchema>;

export const SetBusinessLicenseStatusSchema = z.object({
  status: z.string().min(1),
  isActive: z.boolean().optional(),
});
export type SetBusinessLicenseStatusDto = z.infer<typeof SetBusinessLicenseStatusSchema>;
