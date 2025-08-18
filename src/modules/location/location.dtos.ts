// src/modules/location/location.dtos.ts
import { z } from 'zod';

const uuid = z.string().uuid();

/** ---------- Create / Update ---------- */

export const CreateLocationSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(256).optional().nullable(),

  // relations (ids)
  locationTypeId: uuid, // required
  addressId: uuid.optional().nullable(),
  visitorAddressId: uuid.optional().nullable(),
  parentLocationId: uuid.optional().nullable(),

  // misc
  externalReference: z.string().max(64).optional().nullable(),
  timeZone: z.string().max(64).optional().nullable(), // e.g., "America/New_York"
  drivingDirections: z.string().max(1024).optional().nullable(),
  latitude: z.number().gte(-90).lte(90).optional().nullable(),
  longitude: z.number().gte(-180).lte(180).optional().nullable(),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

export type CreateLocationDto = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationDto = z.infer<typeof UpdateLocationSchema>;

/** ---------- List / Query ---------- */

export const ListLocationsSchema = z.object({
  // free-text (applies to name, description, externalReference, timeZone)
  q: z.string().optional(),

  // precise filters
  name: z.string().optional(),
  locationTypeId: uuid.optional(),
  parentLocationId: uuid.optional(),
  addressId: uuid.optional(),
  visitorAddressId: uuid.optional(),
  hasVisitorAddress: z.coerce.boolean().optional(),

  // pagination & sorting
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type ListLocationsQuery = z.infer<typeof ListLocationsSchema>;

/** ---------- Route params / Responses (optional but handy) ---------- */

export const LocationIdParamSchema = z.object({
  id: uuid,
});
export type LocationIdParam = z.infer<typeof LocationIdParamSchema>;

export const LocationResponseSchema = z.object({
  id: uuid,
  name: z.string(),
  description: z.string().nullable(),

  locationTypeId: uuid,
  addressId: uuid.nullable(),
  visitorAddressId: uuid.nullable(),
  parentLocationId: uuid.nullable(),

  externalReference: z.string().nullable(),
  timeZone: z.string().nullable(),
  drivingDirections: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type LocationResponseDto = z.infer<typeof LocationResponseSchema>;
