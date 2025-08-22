import { z } from 'zod';

export const CreateHealthcareFacilitySchema = z.object({
  name: z.string().min(1).max(256),
  accountId: z.string().uuid(),

  location: z.string().max(256).optional().nullable(),
  locationType: z.string().max(128).optional().nullable(),
  licensedBedCount: z.number().int().min(0).optional().nullable(),

  facilityType: z.string().max(128).optional().nullable(),
  availabilityExceptions: z.string().max(512).optional().nullable(),
  alwaysOpen: z.boolean().optional(),

  sourceSystem: z.string().max(128).optional().nullable(),
  sourceSystemId: z.string().max(128).optional().nullable(),
  sourceSystemModified: z.coerce.date().optional().nullable(),

  addressId: z.string().uuid().optional().nullable(),
});

export const UpdateHealthcareFacilitySchema = CreateHealthcareFacilitySchema.partial();

export type CreateHealthcareFacilityDto = z.infer<typeof CreateHealthcareFacilitySchema>;
export type UpdateHealthcareFacilityDto = z.infer<typeof UpdateHealthcareFacilitySchema>;

export const ListHealthcareFacilitiesSchema = z.object({
  q: z.string().optional(),

  accountId: z.string().uuid().optional(),
  locationType: z.string().optional(),
  facilityType: z.string().optional(),
  alwaysOpen: z.coerce.boolean().optional(),
  sourceSystem: z.string().optional(),

  licensedBedCountMin: z.coerce.number().int().min(0).optional(),
  licensedBedCountMax: z.coerce.number().int().min(0).optional(),
  sourceSystemModifiedFrom: z.coerce.date().optional(),
  sourceSystemModifiedTo: z.coerce.date().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'updatedAt', 'name', 'licensedBedCount', 'sourceSystemModified'])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListHealthcareFacilitiesQuery = z.infer<typeof ListHealthcareFacilitiesSchema>;
