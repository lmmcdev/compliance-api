// src/modules/business-license/business-license.dto.ts
import { z } from 'zod';

export const BusinessLicenseStatusEnum = z.enum(['Completed', 'Active', 'Inactive', 'Pending']);

export const CreateBusinessLicenseSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1),

  issueDate: z.string().datetime().nullable().optional(),
  renewalDate: z.string().datetime().nullable().optional(),
  terminationDate: z.string().datetime().nullable().optional(),

  licenseNumber: z.string().nullable().optional(),
  certificateNumber: z.string().nullable().optional(),

  status: z.union([BusinessLicenseStatusEnum, z.string()]).nullable().optional(),
  isActive: z.boolean().optional().default(false),

  description: z.string().nullable().optional(),

  licenseTypeId: z.string().uuid().nullable().optional(),
  healthcareFacilityId: z.string().uuid().nullable().optional(),
  healthcareProviderId: z.string().uuid().nullable().optional(),
});

export const UpdateBusinessLicenseSchema = CreateBusinessLicenseSchema.partial();

export const ListBusinessLicensesSchema = z.object({
  accountId: z.string().uuid(),
  q: z.string().optional(), // searches name/licenseNumber/certificateNumber
  status: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  licenseTypeId: z.string().uuid().nullable().optional(),
  healthcareFacilityId: z.string().uuid().nullable().optional(),
  healthcareProviderId: z.string().uuid().nullable().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'name', 'issueDate', 'renewalDate']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export const SetStatusSchema = z.object({
  status: z.string().nullable(), // null => clear
});
export const SetActiveSchema = z.object({
  isActive: z.boolean(),
});

export type CreateBusinessLicenseDto = z.infer<typeof CreateBusinessLicenseSchema>;
export type UpdateBusinessLicenseDto = z.infer<typeof UpdateBusinessLicenseSchema>;
export type ListBusinessLicensesQuery = z.infer<typeof ListBusinessLicensesSchema>;
export type SetStatusDto = z.infer<typeof SetStatusSchema>;
export type SetActiveDto = z.infer<typeof SetActiveSchema>;
