import { HealthcareProviderRepository } from './healthcare-provider.repository';
import { HealthcareProviderDoc } from './healthcare-provider.doc';
import {
  CreateHealthcareProviderSchema,
  UpdateHealthcareProviderSchema,
  ListHealthcareProvidersSchema,
} from './healthcare-provider.dto';
import { NotFoundError } from '../../http/app-error';

export interface IHealthcareProviderService {
  create(payload: unknown): Promise<HealthcareProviderDoc>;
  update(id: string, accountId: string, payload: unknown): Promise<HealthcareProviderDoc>;
  get(id: string, accountId: string): Promise<HealthcareProviderDoc>;
  list(
    query: unknown,
  ): Promise<{ items: HealthcareProviderDoc[]; continuationToken: string | null }>;
  remove(id: string, accountId: string): Promise<void>;
}

export class HealthcareProviderService implements IHealthcareProviderService {
  constructor(private readonly repo: HealthcareProviderRepository) {}

  static async createInstance(): Promise<HealthcareProviderService> {
    const repo = await new HealthcareProviderRepository().init();
    return new HealthcareProviderService(repo);
  }

  async create(payload: unknown): Promise<HealthcareProviderDoc> {
    const dto = CreateHealthcareProviderSchema.parse(payload);
    return this.repo.create(dto);
  }

  async update(id: string, accountId: string, payload: unknown): Promise<HealthcareProviderDoc> {
    const patch = UpdateHealthcareProviderSchema.parse(payload);
    const current = await this.repo.findById(id, accountId);
    if (!current)
      throw new NotFoundError(`Healthcare provider ${id} not found for account ${accountId}.`);
    const updated = await this.repo.update(id, accountId, patch);
    if (!updated) throw new NotFoundError('Healthcare provider not found after update');
    return updated;
  }

  async get(id: string, accountId: string): Promise<HealthcareProviderDoc> {
    const found = await this.repo.findById(id, accountId);
    if (!found)
      throw new NotFoundError(`Healthcare provider ${id} not found for account ${accountId}.`);
    return found;
  }

  async list(query: unknown) {
    const q = ListHealthcareProvidersSchema.parse(query);
    return this.repo.listByAccount(q.accountId, {
      pageSize: q.pageSize,
      token: q.token,
      q: q.q,
      status: q.status,
      npi: q.npi,
      facilityId: q.facilityId,
      pcp: q.pcp,
      attendingPhysician: q.attendingPhysician,
      inHouse: q.inHouse,
      sort: q.sort,
      order: q.order,
    });
  }

  async remove(id: string, accountId: string): Promise<void> {
    const found = await this.repo.findById(id, accountId);
    if (!found)
      throw new NotFoundError(`Healthcare provider ${id} not found for account ${accountId}.`);
    await this.repo.delete(id, accountId);
  }
}
