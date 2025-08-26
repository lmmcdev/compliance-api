import { Container, PatchOperation, RequestOptions, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'crypto';
import { getContainer } from '../../infrastructure/cosmos';
import { HealthcareProviderDoc } from './healthcare-provider.doc';

const CONTAINER_ID = 'healthcare_providers';
const PK_PATH = '/accountId';

export class HealthcareProviderRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(
    data: Omit<HealthcareProviderDoc, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<HealthcareProviderDoc> {
    const now = new Date().toISOString();
    const doc: HealthcareProviderDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,

      accountId: data.accountId,
      healthcareProviderName: data.healthcareProviderName.trim(),

      providerType: data.providerType ?? null,
      providerSubtype: data.providerSubtype ?? null,
      providerClass: data.providerClass ?? null,
      status: data.status ?? null,

      mdvitaHealthCareId: data.mdvitaHealthCareId ?? null,
      npi: data.npi ?? null,
      practitioner: data.practitioner ?? null,

      autonomousAprn: data.autonomousAprn ?? false,
      daysOff: data.daysOff ?? null,

      inHouse: data.inHouse ?? false,
      providerId: data.providerId ?? null,

      pcp: data.pcp ?? false,
      attendingPhysician: data.attendingPhysician ?? false,

      effectiveFrom: data.effectiveFrom ?? null,
      effectiveTo: data.effectiveTo ?? null,
      terminationDate: data.terminationDate ?? null,

      totalLicensedBeds: data.totalLicensedBeds ?? null,
      useCmsMaContractAmendment: data.useCmsMaContractAmendment ?? false,

      facilityId: data.facilityId ?? null,
      facilityIIId: data.facilityIIId ?? null,
      facilityIIIId: data.facilityIIIId ?? null,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as HealthcareProviderDoc;
  }

  async findById(id: string, accountId: string): Promise<HealthcareProviderDoc | null> {
    try {
      const { resource } = await this.container.item(id, accountId).read<HealthcareProviderDoc>();
      return resource ?? null;
    } catch {
      return null;
    }
  }

  async findByNpi(accountId: string, npi: string): Promise<HealthcareProviderDoc | null> {
    const spec: SqlQuerySpec = {
      query: 'SELECT TOP 1 * FROM c WHERE c.accountId = @accountId AND c.npi = @npi',
      parameters: [
        { name: '@accountId', value: accountId },
        { name: '@npi', value: npi },
      ],
    };
    const { resources } = await this.container.items
      .query<HealthcareProviderDoc>(spec, {
        partitionKey: accountId,
      })
      .fetchAll();
    return resources[0] ?? null;
  }

  async listByAccount(
    accountId: string,
    opts?: {
      pageSize?: number;
      token?: string;
      q?: string;
      status?: string;
      npi?: string;
      facilityId?: string | null;
      pcp?: boolean;
      attendingPhysician?: boolean;
      inHouse?: boolean;
      sort?: 'createdAt' | 'updatedAt' | 'healthcareProviderName';
      order?: 'ASC' | 'DESC';
    },
  ): Promise<{ items: HealthcareProviderDoc[]; continuationToken: string | null }> {
    const {
      pageSize = 50,
      token,
      q,
      status,
      npi,
      facilityId,
      pcp,
      attendingPhysician,
      inHouse,
      sort = 'createdAt',
      order = 'DESC',
    } = opts ?? {};

    const filters: string[] = ['c.accountId = @accountId'];
    const params: { name: string; value: any }[] = [{ name: '@accountId', value: accountId }];

    if (q) {
      filters.push(
        '(CONTAINS(LOWER(c.healthcareProviderName), @q) OR ' +
          ' CONTAINS(LOWER(c.practitioner), @q) OR ' +
          ' CONTAINS(LOWER(c.npi), @q) OR ' +
          ' CONTAINS(LOWER(c.providerId), @q))',
      );
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (status) {
      filters.push('c.status = @status');
      params.push({ name: '@status', value: status });
    }
    if (npi) {
      filters.push('c.npi = @npi');
      params.push({ name: '@npi', value: npi });
    }
    if (facilityId === null) {
      filters.push('(NOT IS_DEFINED(c.facilityId) OR IS_NULL(c.facilityId))');
    } else if (typeof facilityId === 'string') {
      filters.push('c.facilityId = @facilityId');
      params.push({ name: '@facilityId', value: facilityId });
    }
    if (pcp !== undefined) {
      filters.push('c.pcp = @pcp');
      params.push({ name: '@pcp', value: !!pcp });
    }
    if (attendingPhysician !== undefined) {
      filters.push('c.attendingPhysician = @attendingPhysician');
      params.push({ name: '@attendingPhysician', value: !!attendingPhysician });
    }
    if (inHouse !== undefined) {
      filters.push('c.inHouse = @inHouse');
      params.push({ name: '@inHouse', value: !!inHouse });
    }

    const spec: SqlQuerySpec = {
      query: `
        SELECT c.id, c.accountId, c.healthcareProviderName, c.providerType, c.providerSubtype, c.providerClass,
               c.status, c.mdvitaHealthCareId, c.npi, c.practitioner,
               c.autonomousAprn, c.daysOff, c.inHouse, c.providerId, c.pcp, c.attendingPhysician,
               c.effectiveFrom, c.effectiveTo, c.terminationDate, c.totalLicensedBeds, c.useCmsMaContractAmendment,
               c.facilityId, c.facilityIIId, c.facilityIIIId, c.createdAt, c.updatedAt
        FROM c
        WHERE ${filters.join(' AND ')}
        ORDER BY c.${sort} ${order}
      `,
      parameters: params,
    };

    const iter = this.container.items.query<HealthcareProviderDoc>(spec, {
      partitionKey: accountId,
      maxItemCount: pageSize,
      continuationToken: token,
    });
    const { resources, continuationToken } = await iter.fetchNext();
    return { items: resources, continuationToken: continuationToken ?? null };
  }

  /** Partial update (PATCH) — lower RU than replace */
  async patch(
    id: string,
    accountId: string,
    ops: PatchOperation[],
    etag?: string,
  ): Promise<HealthcareProviderDoc | null> {
    const options: RequestOptions = {};
    if (etag) options.accessCondition = { type: 'IfMatch', condition: etag };
    const withStamp: PatchOperation[] = [
      ...ops,
      { op: 'set', path: '/updatedAt', value: new Date().toISOString() },
    ];
    const { resource } = await this.container
      .item(id, accountId)
      .patch<HealthcareProviderDoc>(withStamp, options);
    return resource ?? null;
  }

  async update(
    id: string,
    accountId: string,
    patch: Partial<Omit<HealthcareProviderDoc, 'id' | 'accountId' | 'createdAt'>>,
  ): Promise<HealthcareProviderDoc | null> {
    const current = await this.findById(id, accountId);
    if (!current) return null;

    const updated: HealthcareProviderDoc = {
      ...current,
      ...(patch.healthcareProviderName !== undefined
        ? { healthcareProviderName: patch.healthcareProviderName.trim() }
        : {}),
      ...(patch.providerType !== undefined ? { providerType: patch.providerType } : {}),
      ...(patch.providerSubtype !== undefined ? { providerSubtype: patch.providerSubtype } : {}),
      ...(patch.providerClass !== undefined ? { providerClass: patch.providerClass } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.mdvitaHealthCareId !== undefined
        ? { mdvitaHealthCareId: patch.mdvitaHealthCareId }
        : {}),
      ...(patch.npi !== undefined ? { npi: patch.npi } : {}),
      ...(patch.practitioner !== undefined ? { practitioner: patch.practitioner } : {}),
      ...(patch.autonomousAprn !== undefined ? { autonomousAprn: !!patch.autonomousAprn } : {}),
      ...(patch.daysOff !== undefined ? { daysOff: patch.daysOff } : {}),
      ...(patch.inHouse !== undefined ? { inHouse: !!patch.inHouse } : {}),
      ...(patch.providerId !== undefined ? { providerId: patch.providerId } : {}),
      ...(patch.pcp !== undefined ? { pcp: !!patch.pcp } : {}),
      ...(patch.attendingPhysician !== undefined
        ? { attendingPhysician: !!patch.attendingPhysician }
        : {}),
      ...(patch.effectiveFrom !== undefined ? { effectiveFrom: patch.effectiveFrom } : {}),
      ...(patch.effectiveTo !== undefined ? { effectiveTo: patch.effectiveTo } : {}),
      ...(patch.terminationDate !== undefined ? { terminationDate: patch.terminationDate } : {}),
      ...(patch.totalLicensedBeds !== undefined
        ? { totalLicensedBeds: patch.totalLicensedBeds }
        : {}),
      ...(patch.useCmsMaContractAmendment !== undefined
        ? { useCmsMaContractAmendment: !!patch.useCmsMaContractAmendment }
        : {}),
      ...(patch.facilityId !== undefined ? { facilityId: patch.facilityId } : {}),
      ...(patch.facilityIIId !== undefined ? { facilityIIId: patch.facilityIIId } : {}),
      ...(patch.facilityIIIId !== undefined ? { facilityIIIId: patch.facilityIIIId } : {}),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, accountId).replace(updated);
    return resource ?? null;
  }

  async delete(id: string, accountId: string): Promise<void> {
    await this.container.item(id, accountId).delete();
  }

  // Convenience helpers
  async setFacilities(
    id: string,
    accountId: string,
    facilities: {
      facilityId?: string | null;
      facilityIIId?: string | null;
      facilityIIIId?: string | null;
    },
    etag?: string,
  ) {
    const ops: PatchOperation[] = [];
    for (const key of ['facilityId', 'facilityIIId', 'facilityIIIId'] as const) {
      const val = facilities[key];
      if (val === undefined) continue;
      if (val === null) ops.push({ op: 'remove', path: `/${key}` });
      else ops.push({ op: 'set', path: `/${key}`, value: val });
    }
    return this.patch(id, accountId, ops, etag);
  }

  async setStatus(id: string, accountId: string, status: string | null, etag?: string) {
    const ops: PatchOperation[] =
      status === null
        ? [{ op: 'remove', path: '/status' }]
        : [{ op: 'set', path: '/status', value: status }];
    return this.patch(id, accountId, ops, etag);
  }
}
