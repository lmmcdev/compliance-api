// src/modules/location/location.dto.ts
import { z } from 'zod';

export const CreateLocationSchema = z.object({
  locationTypeId: z.uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  externalReference: z.string().nullable().optional(),
  addressId: z.uuid().nullable().optional(),
  visitorAddressId: z.uuid().nullable().optional(),
  timeZone: z.string().optional().default('America/New_York'),
  drivingDirections: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  parentLocationId: z.uuid().nullable().optional(),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

export const ListLocationsSchema = z.object({
  locationTypeId: z.uuid(),
  q: z.string().optional(),
  parentLocationId: z.uuid().nullable().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});
