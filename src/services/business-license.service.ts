import { DataSource } from 'typeorm';
import {
  CreateBusinessLicenseDto,
  CreateBusinessLicenseSchema,
  UpdateBusinessLicenseDto,
  UpdateBusinessLicenseSchema,
  ListBusinessLicensesQuery,
  ListBusinessLicensesSchema,
  PageResult,
} from '../dtos';
import { BusinessLicense } from '../entities/business-license.entity';
import { BusinessLicenseRepository, IBusinessLicenseRepository } from '../repositories';
import { ConflictError, NotFoundError } from '../http';

export interface IBusinessLicenseService {
  create(payload: unknown): Promise<BusinessLicense>;
  update(id: string, payload: unknown): Promise<BusinessLicense>;
  get(id: string): Promise<BusinessLicense>;
  list(query: unknown): Promise<PageResult<BusinessLicense>>;
  setStatus(id: string, status: string, isActive?: boolean): Promise<BusinessLicense>;
  remove(id: string): Promise<void>;
}

export class BusinessLicenseService implements IBusinessLicenseService {
  private readonly repo: IBusinessLicenseRepository;

  constructor(ds: DataSource, repo?: IBusinessLicenseRepository) {
    this.repo = repo ?? new BusinessLicenseRepository(ds);
  }

  async create(payload: unknown): Promise<BusinessLicense> {
    const dto = CreateBusinessLicenseSchema.parse(payload);

    // Optional uniqueness check per account + licenseNumber
    if (dto.licenseNumber) {
      const existing = await this.repo.findByLicenseNumber(
        dto.licenseNumber,
        dto.accountId ?? null,
      );
      if (existing) {
        throw new ConflictError(
          'A business license with this number already exists for the account.',
        );
      }
    }

    const data: Partial<BusinessLicense> = {
      name: dto.name,
      issueDate: dto.issueDate ?? null,
      renewalDate: dto.renewalDate ?? null,
      terminationDate: dto.terminationDate ?? null,
      licenseNumber: dto.licenseNumber ?? null,
      certificateNumber: dto.certificateNumber ?? null,
      status: (dto.status as string | null) ?? null,
      isActive: dto.isActive ?? false,
      description: dto.description ?? null,

      // relations by id (TypeORM will map via RelationId on save if you include stubs)
      licenseType: dto.licenseTypeId ? ({ id: dto.licenseTypeId } as any) : null,
      healthcareFacility: dto.healthcareFacilityId
        ? ({ id: dto.healthcareFacilityId } as any)
        : null,
      healthcareProvider: dto.healthcareProviderId
        ? ({ id: dto.healthcareProviderId } as any)
        : null,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<BusinessLicense> {
    const dto = UpdateBusinessLicenseSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('BusinessLicense not found');

    if (dto.licenseNumber && dto.licenseNumber !== current.licenseNumber) {
      const existing = await this.repo.findByLicenseNumber(
        dto.licenseNumber,
        dto.accountId ?? current.account?.id ?? null,
      );
      if (existing && existing.id !== id) {
        throw new ConflictError(
          'A business license with this number already exists for the account.',
        );
      }
    }

    const patch: Partial<BusinessLicense> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      issueDate: dto.issueDate ?? current.issueDate ?? null,
      renewalDate: dto.renewalDate ?? current.renewalDate ?? null,
      terminationDate: dto.terminationDate ?? current.terminationDate ?? null,
      licenseNumber: dto.licenseNumber ?? current.licenseNumber ?? null,
      certificateNumber: dto.certificateNumber ?? current.certificateNumber ?? null,
      status: (dto.status as string | null) ?? current.status ?? null,
      isActive: dto.isActive ?? current.isActive,
      description: dto.description ?? current.description ?? null,

      licenseType:
        dto.licenseTypeId !== undefined
          ? dto.licenseTypeId
            ? ({ id: dto.licenseTypeId } as any)
            : null
          : current.licenseType,
      healthcareFacility:
        dto.healthcareFacilityId !== undefined
          ? dto.healthcareFacilityId
            ? ({ id: dto.healthcareFacilityId } as any)
            : null
          : current.healthcareFacility,
      healthcareProvider:
        dto.healthcareProviderId !== undefined
          ? dto.healthcareProviderId
            ? ({ id: dto.healthcareProviderId } as any)
            : null
          : current.healthcareProvider,
      account:
        dto.accountId !== undefined
          ? dto.accountId
            ? ({ id: dto.accountId } as any)
            : null
          : current.account,
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('BusinessLicense not found after update');
    return updated;
  }

  async get(id: string): Promise<BusinessLicense> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('BusinessLicense not found');
    return entity;
  }

  async list(query: unknown) {
    const q = ListBusinessLicensesSchema.parse(query);
    return this.repo.list(q);
  }

  async setStatus(id: string, status: string, isActive?: boolean): Promise<BusinessLicense> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('BusinessLicense not found');

    const patch: Partial<BusinessLicense> = { status };
    if (typeof isActive === 'boolean') patch.isActive = isActive;

    const updated = await this.repo.updateAndSave(id, patch);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('BusinessLicense not found');
    await this.repo.deleteHard(id);
  }
}
