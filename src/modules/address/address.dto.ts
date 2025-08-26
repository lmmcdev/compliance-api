// src/modules/address/address.dto.ts
import { z } from 'zod';
import { AddressType } from '../../types';

// Create
export const CreateAddressSchema = z.object({
  // PK (Cosmos): required in body when using prefix-only routes
  locationTypeId: z.uuid(),

  street: z.string().min(1),
  city: z.string().min(1),

  // normalize to uppercase 2-letter codes
  state: z
    .string()
    .length(2)
    .transform((s) => s.toUpperCase())
    .default('FL'),
  zip: z.string().min(3).max(15),

  country: z
    .string()
    .length(100)
    .transform((s) => s.toUpperCase())
    .default('UNITED STATES'),

  county: z.string().min(1),

  addressType: z.enum(AddressType),

  drivingDirections: z.string().optional(),
  description: z.string().nullable().optional(),
  timeZone: z.string().optional(),
  lead: z.string().nullable().optional(),
});

// Partial update
export const UpdateAddressSchema = CreateAddressSchema.partial();

// List (token paging within a single partition)
export const ListAddressesSchema = z.object({
  locationTypeId: z.uuid(), // PK required
  q: z.string().optional(),
  addressType: z.enum(AddressType).optional(),

  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),

  // keep consistent with other modules
  sort: z.enum(['createdAt', 'updatedAt', 'street']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

// Types
export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
export type ListAddressesQuery = z.infer<typeof ListAddressesSchema>;
