// src/modules/business-license/business-license.repository.ts
import { Container, PatchOperation, RequestOptions, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'crypto';
import { getContainer } from '../../infrastructure/cosmos';
import { BusinessLicenseDoc } from './business-license.doc';

const CONTAINER_ID = 'business_licenses';
const PK_PATH = '/accountId';

export class BusinessLicenseRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(
    data: Omit<BusinessLicenseDoc, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<BusinessLicenseDoc> {
    const now = new Date().toISOString();
    const doc: BusinessLicenseDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,

      accountId: data.accountId,
      name: data.name.trim(),

      issueDate: data.issueDate ?? null,
      renewalDate: data.renewalDate ?? null,
      terminationDate: data.terminationDate ?? null,

      licenseNumber: data.licenseNumber ?? null,
      certificateNumber: data.certificateNumber ?? null,

      status: data.status ?? null,
      isActive: data.isActive ?? false,

      description: data.description ?? null,

      licenseTypeId: data.licenseTypeId ?? null,
      healthcareFacilityId: data.healthcareFacilityId ?? null,
      healthcareProviderId: data.healthcareProviderId ?? null,
    };
    const { resource } = await this.container.items.create(doc);
    return resource as BusinessLicenseDoc;
  }

  async findById(id: string, accountId: string): Promise<BusinessLicenseDoc | null> {
    try {
      const { resource } = await this.container.item(id, accountId).read<BusinessLicenseDoc>();
      return resource ?? null;
    } catch {
      return null;
    }
  }

  async findByLicenseNumber(
    accountId: string,
    licenseNumber: string,
  ): Promise<BusinessLicenseDoc | null> {
    const spec: SqlQuerySpec = {
      query: `
        SELECT TOP 1 * FROM c
        WHERE c.accountId = @accountId AND LOWER(c.licenseNumber) = @ln
      `,
      parameters: [
        { name: '@accountId', value: accountId },
        { name: '@ln', value: licenseNumber.toLowerCase() },
      ],
    };
    const { resources } = await this.container.items
      .query<BusinessLicenseDoc>(spec, {
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
      isActive?: boolean;
      licenseTypeId?: string | null;
      healthcareFacilityId?: string | null;
      healthcareProviderId?: string | null;
      sort?: 'createdAt' | 'updatedAt' | 'name' | 'issueDate' | 'renewalDate';
      order?: 'ASC' | 'DESC';
    },
  ): Promise<{ items: BusinessLicenseDoc[]; continuationToken: string | null }> {
    const {
      pageSize = 50,
      token,
      q,
      status,
      isActive,
      licenseTypeId,
      healthcareFacilityId,
      healthcareProviderId,
      sort = 'createdAt',
      order = 'DESC',
    } = opts ?? {};

    const filters: string[] = ['c.accountId = @accountId'];
    const params: { name: string; value: any }[] = [{ name: '@accountId', value: accountId }];

    if (q) {
      filters.push(
        '(CONTAINS(LOWER(c.name), @q) OR CONTAINS(LOWER(c.licenseNumber), @q) OR CONTAINS(LOWER(c.certificateNumber), @q))',
      );
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (status) {
      filters.push('c.status = @status');
      params.push({ name: '@status', value: status });
    }
    if (isActive !== undefined) {
      filters.push('c.isActive = @isActive');
      params.push({ name: '@isActive', value: !!isActive });
    }
    if (licenseTypeId === null) {
      filters.push('(NOT IS_DEFINED(c.licenseTypeId) OR IS_NULL(c.licenseTypeId))');
    } else if (typeof licenseTypeId === 'string') {
      filters.push('c.licenseTypeId = @lt');
      params.push({ name: '@lt', value: licenseTypeId });
    }
    if (healthcareFacilityId === null) {
      filters.push('(NOT IS_DEFINED(c.healthcareFacilityId) OR IS_NULL(c.healthcareFacilityId))');
    } else if (typeof healthcareFacilityId === 'string') {
      filters.push('c.healthcareFacilityId = @hf');
      params.push({ name: '@hf', value: healthcareFacilityId });
    }
    if (healthcareProviderId === null) {
      filters.push('(NOT IS_DEFINED(c.healthcareProviderId) OR IS_NULL(c.healthcareProviderId))');
    } else if (typeof healthcareProviderId === 'string') {
      filters.push('c.healthcareProviderId = @hp');
      params.push({ name: '@hp', value: healthcareProviderId });
    }

    const spec: SqlQuerySpec = {
      query: `
        SELECT c.id, c.accountId, c.name, c.issueDate, c.renewalDate, c.terminationDate,
               c.licenseNumber, c.certificateNumber, c.status, c.isActive, c.description,
               c.licenseTypeId, c.healthcareFacilityId, c.healthcareProviderId,
               c.createdAt, c.updatedAt
        FROM c
        WHERE ${filters.join(' AND ')}
        ORDER BY c.${sort} ${order}
      `,
      parameters: params,
    };

    const iter = this.container.items.query<BusinessLicenseDoc>(spec, {
      partitionKey: accountId,
      maxItemCount: pageSize,
      continuationToken: token,
    });
    const { resources, continuationToken } = await iter.fetchNext();
    return { items: resources, continuationToken: continuationToken ?? null };
  }

  async patch(
    id: string,
    accountId: string,
    ops: PatchOperation[],
    etag?: string,
  ): Promise<BusinessLicenseDoc | null> {
    const options: RequestOptions = {};
    if (etag) options.accessCondition = { type: 'IfMatch', condition: etag };
    const withStamp: PatchOperation[] = [
      ...ops,
      { op: 'set', path: '/updatedAt', value: new Date().toISOString() },
    ];
    const { resource } = await this.container
      .item(id, accountId)
      .patch<BusinessLicenseDoc>(withStamp, options);
    return resource ?? null;
  }

  async setStatus(id: string, accountId: string, status: string | null, etag?: string) {
    const ops: PatchOperation[] =
      status === null
        ? [{ op: 'remove', path: '/status' }]
        : [{ op: 'set', path: '/status', value: status }];
    return this.patch(id, accountId, ops, etag);
  }

  async setActive(id: string, accountId: string, isActive: boolean, etag?: string) {
    const ops: PatchOperation[] = [{ op: 'set', path: '/isActive', value: !!isActive }];
    return this.patch(id, accountId, ops, etag);
  }

  async update(
    id: string,
    accountId: string,
    patch: Partial<Omit<BusinessLicenseDoc, 'id' | 'accountId' | 'createdAt'>>,
  ): Promise<BusinessLicenseDoc | null> {
    const current = await this.findById(id, accountId);
    if (!current) return null;

    const updated: BusinessLicenseDoc = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.issueDate !== undefined ? { issueDate: patch.issueDate } : {}),
      ...(patch.renewalDate !== undefined ? { renewalDate: patch.renewalDate } : {}),
      ...(patch.terminationDate !== undefined ? { terminationDate: patch.terminationDate } : {}),
      ...(patch.licenseNumber !== undefined ? { licenseNumber: patch.licenseNumber } : {}),
      ...(patch.certificateNumber !== undefined
        ? { certificateNumber: patch.certificateNumber }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.isActive !== undefined ? { isActive: !!patch.isActive } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.licenseTypeId !== undefined ? { licenseTypeId: patch.licenseTypeId } : {}),
      ...(patch.healthcareFacilityId !== undefined
        ? { healthcareFacilityId: patch.healthcareFacilityId }
        : {}),
      ...(patch.healthcareProviderId !== undefined
        ? { healthcareProviderId: patch.healthcareProviderId }
        : {}),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, accountId).replace(updated);
    return resource ?? null;
  }

  async delete(id: string, accountId: string): Promise<void> {
    await this.container.item(id, accountId).delete();
  }
}
