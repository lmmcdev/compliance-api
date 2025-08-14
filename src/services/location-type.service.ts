import { DataSource } from 'typeorm';
import { z } from 'zod';
import { LocationType, LocationTypeCode } from '../entities/location-type.entity';
import { LocationTypeRepository } from '../repositories/location-type.repository';

export const createLocationTypeSchema = z.object({
  code: z.enum(LocationTypeCode),
  displayName: z.string().min(1).max(128),
  description: z.string().max(256).optional().nullable(),
});
export const updateLocationTypeSchema = createLocationTypeSchema.partial();

export class LocationTypeService {
  private repo: LocationTypeRepository;

  constructor(ds: DataSource) {
    this.repo = new LocationTypeRepository(ds);
  }

  list(page?: number, pageSize?: number) {
    return this.repo.findPaged(page, pageSize);
  }

  get(id: string) {
    return this.repo.findById(id);
  }

  create(payload: unknown) {
    const data = createLocationTypeSchema.parse(payload) as Pick<
      LocationType,
      'code' | 'displayName' | 'description'
    >;
    return this.repo.createOne(data);
  }

  update(id: string, payload: unknown) {
    const data = updateLocationTypeSchema.parse(payload) as Partial<LocationType>;
    return this.repo.updateOne(id, data);
  }

  remove(id: string) {
    return this.repo.softDelete(id);
  }
}
