// src/modules/account/account.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { AccountDoc } from './account.doc';
import { randomUUID } from 'crypto';
import { ConflictError, NotFoundError } from '../../http';

const CONTAINER_ID = 'accounts';
const PK_PATH = '/accountNumber';

export class AccountRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async findByAccountNumber(accountNumber: string): Promise<AccountDoc | null> {
    try {
      const { resources } = await this.container.items
        .query<AccountDoc>({
          query: 'SELECT * FROM c WHERE c.accountNumber = @accountNumber',
          parameters: [{ name: '@accountNumber', value: accountNumber }],
        })
        .fetchNext();
      return resources && resources.length > 0 ? (resources[0] as AccountDoc) : null;
    } catch {
      return null;
    }
  }

  async create(data: Omit<AccountDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountDoc> {
    const { accountNumber } = data;
    const existing = await this.findByAccountNumber(accountNumber);
    if (existing)
      throw new ConflictError(`Account with accountNumber ${accountNumber} already exists`);

    const now = new Date().toISOString();
    const doc: AccountDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    const { resource } = await this.container.items.create(doc);
    return resource as AccountDoc;
  }

  // Point read: you MUST provide the partition key (accountNumber)
  async findById(id: string, accountNumber: string): Promise<AccountDoc | null> {
    try {
      const { resource } = await this.container.item(id, accountNumber).read<AccountDoc>();
      return resource ? (resource as AccountDoc) : null;
    } catch {
      return null;
    }
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    q?: string;
    plan?: string;
    payer?: string;
  }) {
    const { pageSize = 50, token, q, plan, payer } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    if (q) {
      filters.push('(CONTAINS(LOWER(c.name), @q) OR CONTAINS(LOWER(c.accountNumber), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }
    if (plan) {
      filters.push('c.plan = @plan');
      params.push({ name: '@plan', value: plan });
    }
    if (payer) {
      filters.push('c.payer = @payer');
      params.push({ name: '@payer', value: payer });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT c.id, c.accountNumber, c.name, c.type, c.phone,
                     c.lastCallDate, c.billingAddressId, c.terminationDateInMDVita,
                     c.mdvitaDisenrollment, c.patientDx, c.diagnoses2, c.centerManagerEmail2,
                     c.healthPlanInsurance, c.payer, c.inHouse, c.fax,
                     c.memberNumber, c.plan, c.planType, c.numberHospitalizations,
                     c.physicalEvaluationLastYear, c.createdAt, c.updatedAt
              FROM c
              ${whereClause}
              ORDER BY c.createdAt DESC`,
      parameters: params,
    };

    const iter = this.container.items.query<AccountDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
      // not restricted to one PK — can span multiple accountNumbers
    });

    const { resources, continuationToken } = await iter.fetchNext();
    return {
      items: resources ? resources.map((item) => item as AccountDoc) : [],
      continuationToken: continuationToken ?? null,
    };
  }

  async update(
    id: string,
    accountNumber: string,
    patch: Partial<Omit<AccountDoc, 'id' | 'createdAt' | 'accountNumber'>>,
  ): Promise<AccountDoc | null> {
    const current = await this.findById(id, accountNumber);
    if (!current) return null;

    const updated: AccountDoc = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await this.container.item(id, accountNumber).replace(updated);
    return resource as AccountDoc;
  }

  async delete(id: string, accountNumber: string): Promise<void> {
    await this.container.item(id, accountNumber).delete();
  }

  async setBillingAddress(
    id: string,
    accountNumber: string,
    billingAddressId: string | null,
  ): Promise<AccountDoc | null> {
    const found = await this.findById(id, accountNumber);
    if (!found)
      throw new NotFoundError(`Account with id ${id} or accountNumber ${accountNumber} not found`);
    // check if billingAddressId exists
    if (found.billingAddressId === billingAddressId) return found;

    return this.update(id, accountNumber, { billingAddressId });
  }
}
