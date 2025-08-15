// src/dtos/location-type.dto.ts
import { z } from 'zod';

export const CreateLocationTypeSchema = z.object({
  code: z.string().min(1).max(128),
  displayName: z.string().min(1).max(128),
  description: z.string().max(256).optional().nullable(),
});

export const UpdateLocationTypeSchema = CreateLocationTypeSchema.partial();

export type CreateLocationTypeDto = z.infer<typeof CreateLocationTypeSchema>;
export type UpdateLocationTypeDto = z.infer<typeof UpdateLocationTypeSchema>;

export const ListLocationTypesSchema = z.object({
  q: z.string().optional(), // free-text over code, displayName, description
  code: z.string().optional(),
  displayName: z.string().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'code', 'displayName']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListLocationTypesQuery = z.infer<typeof ListLocationTypesSchema>;
