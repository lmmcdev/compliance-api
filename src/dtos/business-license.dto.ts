import { z } from 'zod';
import { BusinessLicenseStatus } from '../entities/business-license.entity';

export const BusinessLicenseStatusSchema = z
  .enum(BusinessLicenseStatus)
  .or(z.string().min(1))
  .optional()
  .nullable();

export const CreateBusinessLicenseSchema = z.object({
  name: z.string().min(1).max(256),
  issueDate: z.date().optional().nullable(),
  renewalDate: z.date().optional().nullable(),
  terminationDate: z.date().optional().nullable(),
  licenseNumber: z.string().max(128).optional().nullable(),
  certificateNumber: z.string().max(128).optional().nullable(),
  status: BusinessLicenseStatusSchema,
  isActive: z.boolean().optional(),
  description: z.string().max(1024).optional().nullable(),

  // relations (all optional)
  licenseTypeId: z.string().uuid().optional().nullable(),
  healthcareFacilityId: z.string().uuid().optional().nullable(),
  healthcareProviderId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
});

export const UpdateBusinessLicenseSchema = CreateBusinessLicenseSchema.partial();

export type CreateBusinessLicenseDto = z.infer<typeof CreateBusinessLicenseSchema>;
export type UpdateBusinessLicenseDto = z.infer<typeof UpdateBusinessLicenseSchema>;

export const ListBusinessLicensesSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  licenseTypeId: z.string().uuid().optional(),
  healthcareFacilityId: z.string().uuid().optional(),
  healthcareProviderId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'updatedAt', 'issueDate', 'renewalDate', 'name', 'licenseNumber'])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});
export type ListBusinessLicensesQuery = z.infer<typeof ListBusinessLicensesSchema>;
