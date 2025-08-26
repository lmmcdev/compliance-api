import { HealthcareFacilityRepository } from './healthcare-facility.repository';
import { HealthcareFacilityDoc } from './healthcare-facility.doc';
import {
  CreateHealthcareFacilitySchema,
  UpdateHealthcareFacilitySchema,
  ListHealthcareFacilitiesSchema,
} from './healthcare-facility.dto';
import { NotFoundError } from '../../http/app-error';

export interface IHealthcareFacilityService {
  create(payload: unknown): Promise<HealthcareFacilityDoc>;
  update(id: string, accountId: string, payload: unknown): Promise<HealthcareFacilityDoc>;
  get(id: string, accountId: string): Promise<HealthcareFacilityDoc>;
  list(
    query: unknown,
  ): Promise<{ items: HealthcareFacilityDoc[]; continuationToken: string | null }>;
  remove(id: string, accountId: string): Promise<void>;
}

export class HealthcareFacilityService implements IHealthcareFacilityService {
  constructor(private readonly repo: HealthcareFacilityRepository) {}

  static async createInstance(): Promise<HealthcareFacilityService> {
    const repo = await new HealthcareFacilityRepository().init();
    return new HealthcareFacilityService(repo);
  }

  async create(payload: unknown): Promise<HealthcareFacilityDoc> {
    const dto = CreateHealthcareFacilitySchema.parse(payload);
    return this.repo.create(dto);
  }

  async update(id: string, accountId: string, payload: unknown): Promise<HealthcareFacilityDoc> {
    const patch = UpdateHealthcareFacilitySchema.parse(payload);

    const current = await this.repo.findById(id, accountId);
    if (!current) {
      throw new NotFoundError(`Healthcare facility ${id} not found for account ${accountId}.`);
    }

    const updated = await this.repo.update(id, accountId, patch);
    if (!updated) throw new NotFoundError('Healthcare facility not found after update');
    return updated;
  }

  async get(id: string, accountId: string): Promise<HealthcareFacilityDoc> {
    const found = await this.repo.findById(id, accountId);
    if (!found) {
      throw new NotFoundError(`Healthcare facility ${id} not found for account ${accountId}.`);
    }
    return found;
  }

  /**
   * Token-based paging within a single partition (/accountId).
   * Query: { accountId, q?, addressId?, pageSize?, token?, sort?, order? }
   */
  async list(
    query: unknown,
  ): Promise<{ items: HealthcareFacilityDoc[]; continuationToken: string | null }> {
    const q = ListHealthcareFacilitiesSchema.parse(query);
    return this.repo.listByAccount(q.accountId, {
      pageSize: q.pageSize,
      token: q.token,
      q: q.q,
      addressId: q.addressId,
      sort: q.sort,
      order: q.order,
    });
  }

  async remove(id: string, accountId: string): Promise<void> {
    const found = await this.repo.findById(id, accountId);
    if (!found) {
      throw new NotFoundError(`Healthcare facility ${id} not found for account ${accountId}.`);
    }
    await this.repo.delete(id, accountId);
  }
}
