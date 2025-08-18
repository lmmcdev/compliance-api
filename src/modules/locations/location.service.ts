// src/services/location.service.ts
import { DataSource, Repository } from 'typeorm';
import { Location } from './location.entity';
import { CreateLocationDto, UpdateLocationDto, ListLocationsQuery } from './location.dtos';
import { LocationRepository } from './location.repository';
import { LocationType } from '../../modules/location-type';
import { Address } from '../../modules/address';
import { PageResult } from '../../shared';
import { BadRequestError, NotFoundError } from '../../http';

export interface ILocationService {
  create(payload: CreateLocationDto): Promise<Location>;
  update(id: string, payload: UpdateLocationDto): Promise<Location>;
  get(id: string): Promise<Location>;
  list(query: ListLocationsQuery): Promise<PageResult<Location>>;
  remove(id: string): Promise<void>;
}

export class LocationService implements ILocationService {
  private readonly repo: LocationRepository;
  private readonly ltRepo: Repository<LocationType>;
  private readonly addrRepo: Repository<Address>;
  private readonly selfRepo: Repository<Location>;

  constructor(private readonly ds: DataSource) {
    this.repo = new LocationRepository(ds);
    this.ltRepo = ds.getRepository(LocationType);
    this.addrRepo = ds.getRepository(Address);
    this.selfRepo = ds.getRepository(Location);
  }

  /** Create a Location validating referenced entities. */
  async create(payload: CreateLocationDto): Promise<Location> {
    const locationType = await this.mustGetLocationType(payload.locationTypeId);
    const address = await this.maybeGetAddress(payload.addressId ?? undefined);
    const visitorAddress = await this.maybeGetAddress(payload.visitorAddressId ?? undefined);
    const parent = await this.maybeGetParent(payload.parentLocationId ?? undefined);

    const entity: Partial<Location> = {
      name: payload.name,
      description: payload.description ?? null,
      locationType,
      address: address ?? null,
      visitorAddress: visitorAddress ?? null,
      parent: parent ?? null,
      externalReference: payload.externalReference ?? null,
      timeZone: payload.timeZone ?? null,
      drivingDirections: payload.drivingDirections ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    };

    return this.repo.createAndSave(entity);
  }

  /** Patch a Location. Only fields present in the payload are applied. */
  async update(id: string, payload: UpdateLocationDto): Promise<Location> {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError(`Location ${id} not found`);

    const patch: Partial<Location> = {};

    if (payload.name !== undefined) patch.name = payload.name;
    if (payload.description !== undefined) patch.description = payload.description ?? null;

    // Relations (respect explicit nulls to clear)
    if (Object.prototype.hasOwnProperty.call(payload, 'locationTypeId')) {
      if (!payload.locationTypeId) throw new BadRequestError('locationTypeId cannot be null/empty');
      patch.locationType = await this.mustGetLocationType(payload.locationTypeId);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'addressId')) {
      patch.address = await this.maybeGetAddress(payload.addressId ?? undefined);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'visitorAddressId')) {
      patch.visitorAddress = await this.maybeGetAddress(payload.visitorAddressId ?? undefined);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'parentLocationId')) {
      const parent = await this.maybeGetParent(payload.parentLocationId ?? undefined);
      if (parent && parent.id === id)
        throw new BadRequestError('A location cannot be its own parent');
      patch.parent = parent ?? null;
    }

    // Misc
    if (payload.externalReference !== undefined) {
      patch.externalReference = payload.externalReference ?? null;
    }
    if (payload.timeZone !== undefined) patch.timeZone = payload.timeZone ?? null;
    if (payload.drivingDirections !== undefined) {
      patch.drivingDirections = payload.drivingDirections ?? null;
    }
    if (payload.latitude !== undefined) patch.latitude = payload.latitude ?? null;
    if (payload.longitude !== undefined) patch.longitude = payload.longitude ?? null;

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError(`Location ${id} not found after update`);
    return updated;
  }

  async get(id: string): Promise<Location> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError(`Location ${id} not found`);
    return entity;
  }

  async list(query: ListLocationsQuery): Promise<PageResult<Location>> {
    return this.repo.list(query);
  }

  async remove(id: string): Promise<void> {
    // Optional: ensure existence first for friendlier API
    const exists = await this.selfRepo.exist({ where: { id } });
    if (!exists) throw new NotFoundError(`Location ${id} not found`);
    await this.repo.deleteHard(id);
  }

  // ---------- helpers ----------

  private async mustGetLocationType(id: string): Promise<LocationType> {
    const lt = await this.ltRepo.findOne({ where: { id } });
    if (!lt) throw new NotFoundError(`LocationType ${id} not found`);
    return lt;
  }

  private async maybeGetAddress(id?: string | null): Promise<Address | null> {
    if (!id) return null;
    const addr = await this.addrRepo.findOne({ where: { id } });
    if (!addr) throw new NotFoundError(`Address ${id} not found`);
    return addr;
  }

  private async maybeGetParent(id?: string | null): Promise<Location | null> {
    if (!id) return null;
    const parent = await this.selfRepo.findOne({ where: { id } });
    if (!parent) throw new NotFoundError(`Parent Location ${id} not found`);
    return parent;
  }
}
