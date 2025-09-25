// src/modules/business-license/business-license.service.ts
import { BusinessLicenseRepository } from './business-license.repository';
import { BusinessLicenseDoc } from './business-license.doc';
import {
  CreateBusinessLicenseSchema,
  UpdateBusinessLicenseSchema,
  ListBusinessLicensesSchema,
  SetStatusSchema,
  SetActiveSchema,
} from './business-license.dto';
import { NotFoundError } from '../../http/app-error';

export class BusinessLicenseService {
  constructor(private readonly repo: BusinessLicenseRepository) {}

  static async createInstance() {
    const repo = await new BusinessLicenseRepository().init();
    return new BusinessLicenseService(repo);
  }

  async create(payload: unknown): Promise<BusinessLicenseDoc> {
    const dto = CreateBusinessLicenseSchema.parse(payload);
    return this.repo.create(dto);
  }

  async update(id: string, accountId: string, payload: unknown): Promise<BusinessLicenseDoc> {
    const patch = UpdateBusinessLicenseSchema.parse(payload);
    const cur = await this.repo.findById(id, accountId);
    if (!cur) throw new NotFoundError(`Business license ${id} not found for account ${accountId}.`);
    const updated = await this.repo.update(id, accountId, patch);
    if (!updated) throw new NotFoundError('Business license not found after update');
    return updated;
  }

  async get(id: string, accountId: string): Promise<BusinessLicenseDoc> {
    const found = await this.repo.findById(id, accountId);
    if (!found)
      throw new NotFoundError(`Business license ${id} not found for account ${accountId}.`);
    return found;
  }

  async list(query: unknown) {
    const q = ListBusinessLicensesSchema.parse(query);
    return this.repo.listByAccount(q.accountId, {
      pageSize: q.pageSize,
      token: q.token,
      q: q.q,
      status: q.status,
      isActive: q.isActive,
      licenseTypeId: q.licenseTypeId,
      healthcareFacilityId: q.healthcareFacilityId,
      healthcareProviderId: q.healthcareProviderId,
      sort: q.sort,
      order: q.order,
    });
  }

  async remove(id: string, accountId: string): Promise<void> {
    const cur = await this.repo.findById(id, accountId);
    if (!cur) throw new NotFoundError(`Business license ${id} not found for account ${accountId}.`);
    await this.repo.delete(id, accountId);
  }

  async setStatus(id: string, accountId: string, payload: unknown, etag?: string) {
    const { status } = SetStatusSchema.parse(payload);
    const cur = await this.repo.findById(id, accountId);
    if (!cur) throw new NotFoundError(`Business license ${id} not found for account ${accountId}.`);
    const updated = await this.repo.setStatus(id, accountId, status ?? null, etag);
    if (!updated) throw new NotFoundError('Business license not found after status update');
    return updated;
  }

  async setActive(id: string, accountId: string, payload: unknown, etag?: string) {
    const { isActive } = SetActiveSchema.parse(payload);
    const cur = await this.repo.findById(id, accountId);
    if (!cur) throw new NotFoundError(`Business license ${id} not found for account ${accountId}.`);
    const updated = await this.repo.setActive(id, accountId, isActive, etag);
    if (!updated) throw new NotFoundError('Business license not found after active update');
    return updated;
  }

  // Additional methods for handling business license documents can be added here
}
