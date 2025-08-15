import { DataSource } from 'typeorm';
import { z, ZodError } from 'zod';
import { Address } from '../entities/address.entity';
import { AddressType } from '../types/enum.type';
import { AddressRepository } from '../repositories/address.repository';

// ---------- validation ----------
export const listAddressSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  locationTypeId: z.string().uuid().optional(),
  city: z.string().max(128).optional(),
  addressType: z.enum(AddressType).optional(),
});

export const createAddressSchema = z.object({
  street: z.string().min(1).max(128),
  city: z.string().min(1).max(128),
  state: z.string().min(2).max(128).default('FL'),
  zip: z.string().min(3).max(10),
  country: z.string().min(2).max(128).default('United States'),
  addressType: z.enum(AddressType),
  drivingDirections: z.string().max(256).optional().nullable(),
  description: z.string().max(256).optional().nullable(),
  timeZone: z.string().max(256).optional().nullable(),
  lead: z.string().max(20).optional().nullable(),
  locationTypeId: z.uuid(), // relation (FK)
});

export const updateAddressSchema = createAddressSchema.partial();

// ---------- service ----------
export class AddressService {
  private repo: AddressRepository;

  constructor(ds: DataSource) {
    this.repo = new AddressRepository(ds);
  }

  private handleError(err: unknown, op: string): never {
    if (err instanceof ZodError) throw err; // let routes map to 400
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`[AddressService] ${op} failed: ${msg}`);
  }

  async list(query: unknown) {
    try {
      const { page, pageSize, locationTypeId, city, addressType } = listAddressSchema.parse(query);

      const where: any = {};
      if (locationTypeId) where.locationType = { id: locationTypeId };
      if (city) where.city = city;
      if (addressType) where.addressType = addressType;

      return await this.repo.findPagedFiltered(page, pageSize, where);
    } catch (err) {
      this.handleError(err, 'list');
    }
  }

  async get(id: string) {
    try {
      return await this.repo.findById(id); // may return null
    } catch (err) {
      this.handleError(err, 'get');
    }
  }

  async create(payload: unknown) {
    try {
      const data = createAddressSchema.parse(payload);

      // Assign relation via id without extra query
      const toSave: Partial<Address> = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        addressType: data.addressType,
        drivingDirections: data.drivingDirections ?? null,
        description: data.description ?? null,
        timeZone: data.timeZone ?? null,
        lead: data.lead ?? null,
        locationType: { id: data.locationTypeId } as any,
      };

      return await this.repo.createOne(toSave);
    } catch (err) {
      this.handleError(err, 'create');
    }
  }

  async update(id: string, payload: unknown) {
    try {
      const data = updateAddressSchema.parse(payload);

      const patch: Partial<Address> = {
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        addressType: data.addressType as any,
        drivingDirections: data.drivingDirections ?? undefined,
        description: data.description ?? undefined,
        timeZone: data.timeZone ?? undefined,
        lead: data.lead ?? undefined,
      };

      if (data.locationTypeId) {
        (patch as any).locationType = { id: data.locationTypeId };
      }

      return await this.repo.updateOne(id, patch); // may return null
    } catch (err) {
      this.handleError(err, 'update');
    }
  }

  async remove(id: string) {
    try {
      await this.repo.softDelete(id);
    } catch (err) {
      this.handleError(err, 'remove');
    }
  }
}
