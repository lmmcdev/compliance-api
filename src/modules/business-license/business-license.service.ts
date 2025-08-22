import { DataSource } from 'typeorm';
import {
  CreateBusinessLicenseSchema,
  UpdateBusinessLicenseSchema,
  ListBusinessLicensesSchema,
  SetBusinessLicenseStatusSchema,
  type CreateBusinessLicenseDto,
  type UpdateBusinessLicenseDto,
  type ListBusinessLicensesQuery,
  type SetBusinessLicenseStatusDto,
} from './business-license.dto';
import { PageResult } from '../../shared';
import { BusinessLicense } from './business-license.entity';
import {
  BusinessLicenseRepository,
  type IBusinessLicenseRepository,
} from './business-license.repository';
import { NotFoundError, ConflictError } from '../../http/app-error';

export interface IBusinessLicenseService {
  create(payload: unknown): Promise<BusinessLicense>;
  update(id: string, payload: unknown): Promise<BusinessLicense>;
  get(id: string): Promise<BusinessLicense>;
  list(query: unknown): Promise<PageResult<BusinessLicense>>;
  setStatus(id: string, statusPayload: unknown): Promise<BusinessLicense>;
  remove(id: string): Promise<void>;
}

export class BusinessLicenseService implements IBusinessLicenseService {
  private readonly repo: IBusinessLicenseRepository;

  constructor(ds: DataSource, repo?: IBusinessLicenseRepository) {
    this.repo = repo ?? new BusinessLicenseRepository(ds);
  }

  async create(payload: unknown): Promise<BusinessLicense> {
    const dto: CreateBusinessLicenseDto = CreateBusinessLicenseSchema.parse(payload);

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
    const dto: UpdateBusinessLicenseDto = UpdateBusinessLicenseSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Business license not found');

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
    if (!updated) throw new NotFoundError('Business license not found after update');
    return updated;
  }

  async get(id: string): Promise<BusinessLicense> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Business license not found');
    return entity;
  }

  async list(query: unknown): Promise<PageResult<BusinessLicense>> {
    const q: ListBusinessLicensesQuery = ListBusinessLicensesSchema.parse(query);
    return this.repo.list(q);
  }

  async setStatus(id: string, statusPayload: unknown): Promise<BusinessLicense> {
    const { status, isActive }: SetBusinessLicenseStatusDto =
      SetBusinessLicenseStatusSchema.parse(statusPayload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Business license not found');

    const updated = await this.repo.updateAndSave(id, {
      status,
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    });
    if (!updated) throw new NotFoundError('Business license not found after status update');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Business license not found');
    await this.repo.deleteHard(id);
  }
}
