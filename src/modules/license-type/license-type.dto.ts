import { z } from 'zod';

export const CreateLicenseTypeSchema = z.object({
  code: z.string().min(2).max(100),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateLicenseTypeSchema = CreateLicenseTypeSchema.partial();

export type CreateLicenseTypeDto = z.infer<typeof CreateLicenseTypeSchema>;
export type UpdateLicenseTypeDto = z.infer<typeof UpdateLicenseTypeSchema>;

export const ListLicenseTypesSchema = z.object({
  q: z.string().optional(),
  code: z.string().optional(),
  displayName: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'code', 'displayName']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
});

export type ListLicenseTypesQuery = z.infer<typeof ListLicenseTypesSchema>;
