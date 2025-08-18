import { DataSource } from 'typeorm';
import {
  CreateAccountDto,
  CreateAccountSchema,
  UpdateAccountDto,
  UpdateAccountSchema,
  ListAccountsQuery,
  ListAccountsSchema,
  PageResult,
} from './account.dto';
import { Account } from './account.entity';
import { AccountRepository, IAccountRepository } from './account.repository';
import { ConflictError, NotFoundError } from '../../http';

export interface IAccountService {
  create(payload: unknown): Promise<Account>;
  update(id: string, payload: unknown): Promise<Account>;
  get(id: string): Promise<Account>;
  list(query: unknown): Promise<PageResult<Account>>;
  remove(id: string): Promise<void>;
  setBillingAddress(id: string, billingAddressId: string | null): Promise<Account>;
}

export class AccountService implements IAccountService {
  private readonly repo: IAccountRepository;

  constructor(ds: DataSource, repo?: IAccountRepository) {
    this.repo = repo ?? new AccountRepository(ds);
  }

  async create(payload: unknown): Promise<Account> {
    const dto: CreateAccountDto = CreateAccountSchema.parse(payload);

    // Graceful uniqueness check before DB constraint
    const exists = await this.repo.findByAccountNumber(dto.accountNumber);
    if (exists) throw new ConflictError('An account with this accountNumber already exists.');

    const data: Partial<Account> = {
      name: dto.name,
      accountNumber: dto.accountNumber,
      type: (dto.type ?? null) as any,
      phone: dto.phone ?? null,
      lastCallDate: dto.lastCallDate ?? null,
      billingAddress: dto.billingAddressId ? ({ id: dto.billingAddressId } as any) : null,
      terminationDateInMDVita: dto.terminationDateInMDVita ?? null,
      mdvitaDisenrollment: dto.mdvitaDisenrollment ?? false,
      patientDx: dto.patientDx ?? null,
      diagnoses2: dto.diagnoses2 ?? null,
      centerManagerEmail2: dto.centerManagerEmail2 ?? null,
      healthPlanInsurance: dto.healthPlanInsurance ?? null,
      payer: dto.payer ?? null,
      inHouse: dto.inHouse ?? false,
      fax: dto.fax ?? null,
      memberNumber: dto.memberNumber ?? null,
      plan: dto.plan ?? null,
      planType: dto.planType ?? null,
      numberHospitalizations: dto.numberHospitalizations ?? null,
      physicalEvaluationLastYear: dto.physicalEvaluationLastYear ?? null,
    };

    return this.repo.createAndSave(data);
  }

  async update(id: string, payload: unknown): Promise<Account> {
    const dto: UpdateAccountDto = UpdateAccountSchema.parse(payload);

    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Account not found');

    if (dto.accountNumber && dto.accountNumber !== current.accountNumber) {
      const exists = await this.repo.findByAccountNumber(dto.accountNumber);
      if (exists && exists.id !== id) {
        throw new ConflictError(
          `An account with accountNumber ${dto.accountNumber} already exists.`,
        );
      }
    }

    const patch: Partial<Account> = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.accountNumber !== undefined ? { accountNumber: dto.accountNumber } : {}),
      ...(dto.type !== undefined ? { type: dto.type as any } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.lastCallDate !== undefined ? { lastCallDate: dto.lastCallDate } : {}),
      ...(dto.billingAddressId !== undefined
        ? { billingAddress: dto.billingAddressId ? ({ id: dto.billingAddressId } as any) : null }
        : {}),
      ...(dto.terminationDateInMDVita !== undefined
        ? { terminationDateInMDVita: dto.terminationDateInMDVita }
        : {}),
      ...(dto.mdvitaDisenrollment !== undefined
        ? { mdvitaDisenrollment: dto.mdvitaDisenrollment }
        : {}),
      ...(dto.patientDx !== undefined ? { patientDx: dto.patientDx } : {}),
      ...(dto.diagnoses2 !== undefined ? { diagnoses2: dto.diagnoses2 } : {}),
      ...(dto.centerManagerEmail2 !== undefined
        ? { centerManagerEmail2: dto.centerManagerEmail2 }
        : {}),
      ...(dto.healthPlanInsurance !== undefined
        ? { healthPlanInsurance: dto.healthPlanInsurance }
        : {}),
      ...(dto.payer !== undefined ? { payer: dto.payer } : {}),
      ...(dto.inHouse !== undefined ? { inHouse: dto.inHouse } : {}),
      ...(dto.fax !== undefined ? { fax: dto.fax } : {}),
      ...(dto.memberNumber !== undefined ? { memberNumber: dto.memberNumber } : {}),
      ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
      ...(dto.planType !== undefined ? { planType: dto.planType } : {}),
      ...(dto.numberHospitalizations !== undefined
        ? { numberHospitalizations: dto.numberHospitalizations }
        : {}),
      ...(dto.physicalEvaluationLastYear !== undefined
        ? { physicalEvaluationLastYear: dto.physicalEvaluationLastYear }
        : {}),
    };

    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Account not found after update');
    return updated;
  }

  async get(id: string): Promise<Account> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Account not found');
    return found;
  }

  async list(query: unknown) {
    const q: ListAccountsQuery = ListAccountsSchema.parse(query);
    return this.repo.list(q);
  }

  async remove(id: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new NotFoundError('Account not found');
    await this.repo.deleteHard(id);
  }

  async setBillingAddress(id: string, billingAddressId: string | null): Promise<Account> {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Account not found');

    const patch: Partial<Account> = {
      billingAddress: billingAddressId ? ({ id: billingAddressId } as any) : null,
    };
    const updated = await this.repo.updateAndSave(id, patch);
    if (!updated) throw new NotFoundError('Account not found after update');
    return updated;
  }
}
