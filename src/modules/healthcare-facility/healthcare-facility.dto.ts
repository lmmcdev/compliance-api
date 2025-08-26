// src/modules/healthcare-facility/healthcare-facility.dto.ts
import { z } from 'zod';

export const CreateHealthcareFacilitySchema = z.object({
  accountId: z.uuid(),
  name: z.string().min(1),
  location: z.string().nullable().optional(),
  locationType: z.string().nullable().optional(),
  licensedBedCount: z.number().int().nullable().optional(),
  facilityType: z.string().nullable().optional(),
  availabilityExceptions: z.string().nullable().optional(),
  alwaysOpen: z.boolean().optional(),
  sourceSystem: z.string().nullable().optional(),
  sourceSystemId: z.string().nullable().optional(),
  sourceSystemModified: z.iso.datetime().nullable().optional(),
  addressId: z.uuid().nullable().optional(),
});

export const UpdateHealthcareFacilitySchema = CreateHealthcareFacilitySchema.partial();

export const ListHealthcareFacilitiesSchema = z.object({
  accountId: z.uuid(),
  q: z.string().optional(),
  addressId: z.uuid().nullable().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateHealthcareFacilityDto = z.infer<typeof CreateHealthcareFacilitySchema>;
export type UpdateHealthcareFacilityDto = z.infer<typeof UpdateHealthcareFacilitySchema>;
export type ListHealthcareFacilitiesQuery = z.infer<typeof ListHealthcareFacilitiesSchema>;
