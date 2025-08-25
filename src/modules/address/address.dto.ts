// src/modules/address/address.dto.ts
import { z } from 'zod';
import { AddressType } from '../../types';

export const CreateAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2).default('FL'),
  zip: z.string().min(3).max(15),
  country: z.string().min(2).max(2).default('US'),
  county: z.string().min(1),
  addressType: z.enum(AddressType),
  drivingDirections: z.string().optional(),
  description: z.string().nullable().optional(),
  timeZone: z.string().optional(),
  lead: z.string().nullable().optional(),
  locationTypeId: z.uuid(), // ensure you pass the PK
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

export const ListAddressesSchema = z.object({
  locationTypeId: z.uuid(),
  q: z.string().optional(),
  addressType: z.enum(AddressType).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
});
