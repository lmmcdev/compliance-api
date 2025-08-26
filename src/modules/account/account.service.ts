// src/modules/account/account.service.ts
import { AccountDoc } from './account.doc';
import { AccountRepository } from './account.repository';
import { CreateAccountSchema } from './account.dto';
import { NotFoundError } from '../../http';
import { AddressRepository } from '../address';

export class AccountService {
  private constructor(
    private readonly accountRepository: AccountRepository,
    private readonly addressRepository: AddressRepository,
  ) {}

  /** Factory: ensures repository is initialized */
  static async createInstance() {
    const accountRepository = await new AccountRepository().init();
    const addressRepository = await new AddressRepository().init();
    return new AccountService(accountRepository, addressRepository);
  }

  async create(payload: unknown): Promise<AccountDoc> {
    const dto = CreateAccountSchema.parse(payload);
    return this.accountRepository.create(dto);
  }

  async get(id: string, accountNumber: string): Promise<AccountDoc | null> {
    const pk = accountNumber;
    const found = await this.accountRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Account with id ${id} or accountNumber ${pk} not found`);
    return found;
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    q?: string;
    plan?: string;
    payer?: string;
  }) {
    return this.accountRepository.list(opts);
  }

  async update(
    id: string,
    accountNumber: string,
    patch: Partial<Omit<AccountDoc, 'id' | 'createdAt' | 'accountNumber'>>,
  ): Promise<AccountDoc | null> {
    const pk = accountNumber;
    const found = await this.accountRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Account with id ${id} or accountNumber ${pk} not found`);
    return this.accountRepository.update(id, pk, patch);
  }

  async remove(id: string, accountNumber: string): Promise<void> {
    const pk = accountNumber;
    const found = await this.accountRepository.findById(id, pk);
    if (!found) throw new NotFoundError(`Account with id ${id} or accountNumber ${pk} not found`);
    return this.accountRepository.delete(id, pk);
  }

  async setBillingAddress(accountId: string, accountNumber: string, billingAddressId: string) {
    // Resolve the PK once, then verify with a cheap point read
    const addressLocationTypeId =
      await this.addressRepository.resolveLocationTypeId(billingAddressId);
    if (!addressLocationTypeId) {
      throw new NotFoundError(`Address ${billingAddressId} not found (or deleted).`);
    }

    return this.accountRepository.setBillingAddress(accountId, accountNumber, billingAddressId);
  }
}
