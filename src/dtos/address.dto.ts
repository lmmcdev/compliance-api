// src/dtos/address.dto.ts
import { z } from 'zod';
import { AddressType } from '../types/enum.type';

export const AddressTypeSchema = z.enum(AddressType);

export const CreateAddressSchema = z.object({
  street: z.string().min(1).max(128),
  city: z.string().min(1).max(128),
  state: z.string().max(128).default('FL'),
  zip: z.string().min(1).max(10),
  country: z.string().max(128).default('United States'),

  addressType: AddressTypeSchema,

  drivingDirections: z.string().max(256).optional().nullable(),
  description: z.string().max(256).optional().nullable(),
  timeZone: z.string().max(256).optional().nullable(),
  lead: z.string().max(20).optional().nullable(),

  // required FK (entity has nullable: false)
  locationTypeId: z.string().uuid(),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

// List / filter / pagination
export const ListAddressesSchema = z.object({
  q: z.string().optional(), // free text over common fields
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  addressType: z.string().optional(),
  locationTypeId: z.string().uuid().optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', 'updatedAt', 'city', 'state', 'zip', 'country', 'addressType'])
    .default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressDto = z.infer<typeof UpdateAddressSchema>;
export type ListAddressesQuery = z.infer<typeof ListAddressesSchema>;
