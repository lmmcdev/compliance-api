import { DataSource } from 'typeorm';
import {
  CreateHealthcareProviderSchema,
  UpdateHealthcareProviderSchema,
  ListHealthcareProvidersSchema,
  type CreateHealthcareProviderDto,
  type UpdateHealthcareProviderDto,
  type ListHealthcareProvidersQuery,
} from './healthcare-provider.dtos';

import { HealthcareProvider } from './healthcare-provider.entity';
import {
  HealthcareProviderRepository,
  type IHealthcareProviderRepository,
} from './healthcare-provider.repository';
import { NotFoundError, ConflictError } from '../../http/app-error';
import { PageResult } from '../../shared';

export interface IHealthcareProviderService {
  create(payload: unknown): Promise<HealthcareProvider>;
  update(id: string, payload: unknown): Promise<HealthcareProvider>;
  get(id: string): Promise<HealthcareProvider>;
  list(query: unknown): Promise<PageResult<HealthcareProvider>>;
  remove(id: string): Promise<void>;
}

export class HealthcareProviderService implements IHealthcareProviderService {
  private readonly repo: IHealthcareProviderRepository;

  constructor(ds: DataSource, repo?: IHealthcareProviderRepository) {
    this.repo = repo ?? new HealthcareProviderRepository(ds);
  }

  async create(payload: unknown): Promise<HealthcareProvider> {
    const dto: CreateHealthcareProviderDto = CreateHealthcareProviderSchema.parse(payload);

    // Optional uniqueness: (accountId, npi) pair
    if (dto.npi) {
      const existing = await this.repo.findByNpi(dto.npi, dto.accountId);
      if (existing) {
        throw new ConflictError('A provider with this NPI already exists for the account.');
      }
    }

    const data: Partial<HealthcareProvider> = {
      healthcareProviderName: dto.healthcareProviderName,

      providerType: dto.providerType ?? null,
      providerSubtype: dto.providerSubtype ?? null,
      providerClass: dto.providerClass ?? null,
      status: dto.status ?? null,
      mdvitaHealthCareId: dto.mdvitaHealthCareId ?? null,
      npi: dto.npi ?? null,
      practitioner: dto.practitioner ?? null,
      daysOff: dto.daysOff ?? null,
      providerId: dto.providerId ?? null,

      autonomousAprn: dto.autonomousAprn ?? false,
      inHouse: dto.inHouse ?? false,
      pcp: dto.pcp ?? false,
      attendingPhysician: dto.attendingPhysician ?? false,
      useCmsMaContractAmendment: dto.useCmsMaContractAmendment ?? false,

      effectiveFrom: dto.effectiveFrom ?? null,
      effectiveTo: dto.effectiveTo ?? null,
      terminationDate: dto.terminationDate ?? null,

      totalLicensedBeds: dto.totalLicensedBeds ?? null,

      // relations
      account: { id: dto.accountId } as any,
      facility: dto.facilityId ? ({ id: dto.facilityId } as any) : null,
      facilityII: dto.facilityIIId ? ({ id: dto.facilityIIId } as any) : null,
      facilityIII: dto.facilityIIIId ? ({ id: dto.facilityIIIId } as any) : null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<HealthcareProvider> {
    const dto: UpdateHealthcareProviderDto = UpdateHealthcareProviderSchema.parse(payload);
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Healthcare provider not found');

    // If NPI or accountId changes, enforce uniqueness on the new pair
    const nextAccountId = dto.accountId ?? current.accountId;
    const nextNpi = dto.npi ?? current.npi ?? undefined;
    if (nextNpi && (nextNpi !== current.npi || nextAccountId !== current.accountId)) {
      const exists = await this.repo.findByNpi(nextNpi, nextAccountId);
      if (exists && exists.id !== id) {
        throw new ConflictError('A provider with this NPI already exists for the account.');
      }
    }

    const patch: Partial<HealthcareProvider> = {
      ...(dto.healthcareProviderName !== undefined
        ? { healthcareProviderName: dto.healthcareProviderName }
        : {}),

      ...(dto.providerType !== undefined ? { providerType: dto.providerType } : {}),
      ...(dto.providerSubtype !== undefined ? { providerSubtype: dto.providerSubtype } : {}),
      ...(dto.providerClass !== undefined ? { providerClass: dto.providerClass } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.mdvitaHealthCareId !== undefined
        ? { mdvitaHealthCareId: dto.mdvitaHealthCareId }
        : {}),
      ...(dto.npi !== undefined ? { npi: dto.npi } : {}),
      ...(dto.practitioner !== undefined ? { practitioner: dto.practitioner } : {}),
      ...(dto.daysOff !== undefined ? { daysOff: dto.daysOff } : {}),
      ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),

      ...(dto.autonomousAprn !== undefined ? { autonomousAprn: dto.autonomousAprn } : {}),
      ...(dto.inHouse !== undefined ? { inHouse: dto.inHouse } : {}),
      ...(dto.pcp !== undefined ? { pcp: dto.pcp } : {}),
      ...(dto.attendingPhysician !== undefined
        ? { attendingPhysician: dto.attendingPhysician }
        : {}),
      ...(dto.useCmsMaContractAmendment !== undefined
        ? { useCmsMaContractAmendment: dto.useCmsMaContractAmendment }
        : {}),

      ...(dto.effectiveFrom !== undefined ? { effectiveFrom: dto.effectiveFrom } : {}),
      ...(dto.effectiveTo !== undefined ? { effectiveTo: dto.effectiveTo } : {}),
      ...(dto.terminationDate !== undefined ? { terminationDate: dto.terminationDate } : {}),

      ...(dto.totalLicensedBeds !== undefined ? { totalLicensedBeds: dto.totalLicensedBeds } : {}),

      ...(dto.accountId !== undefined ? { account: { id: dto.accountId } as any } : {}),
      ...(dto.facilityId !== undefined
        ? { facility: dto.facilityId ? ({ id: dto.facilityId } as any) : null }
        : {}),
      ...(dto.facilityIIId !== undefined
        ? { facilityII: dto.facilityIIId ? ({ id: dto.facilityIIId } as any) : null }
        : {}),
      ...(dto.facilityIIIId !== undefined
        ? { facilityIII: dto.facilityIIIId ? ({ id: dto.facilityIIIId } as any) : null }
        : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Healthcare provider not found after update');
    return updated;
  }

  async get(id: string): Promise<HealthcareProvider> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError('Healthcare provider not found');
    return entity;
  }

  async list(query: unknown): Promise<PageResult<HealthcareProvider>> {
    const q: ListHealthcareProvidersQuery = ListHealthcareProvidersSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Healthcare provider not found');
    await this.repo.deleteHard(id);
  }
}
