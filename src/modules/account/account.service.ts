// src/modules/account/account.service.ts
import { AccountDoc } from './account.doc';
import { AccountRepository } from './account.repository';
import { CreateAccountSchema } from './account.dto';

export class AccountService {
  private constructor(private readonly repo: AccountRepository) {}

  /** Factory: ensures repository is initialized */
  static async createInstance() {
    const repo = await new AccountRepository().init();
    return new AccountService(repo);
  }

  async create(payload: unknown): Promise<AccountDoc> {
    const dto = CreateAccountSchema.parse(payload);
    return this.repo.create(dto);
  }

  async get(id: string, accountNumber: string): Promise<AccountDoc | null> {
    return this.repo.findById(id, accountNumber);
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    q?: string;
    plan?: string;
    payer?: string;
  }) {
    return this.repo.list(opts);
  }

  async update(
    id: string,
    accountNumber: string,
    patch: Partial<Omit<AccountDoc, 'id' | 'createdAt' | 'accountNumber'>>,
  ): Promise<AccountDoc | null> {
    return this.repo.update(id, accountNumber, patch);
  }

  async remove(id: string, accountNumber: string): Promise<void> {
    return this.repo.delete(id, accountNumber);
  }

  async setBillingAddress(
    id: string,
    accountNumber: string,
    billingAddressId: string | null,
  ): Promise<AccountDoc | null> {
    return this.repo.setBillingAddress(id, accountNumber, billingAddressId);
  }
}
