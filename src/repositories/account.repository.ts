import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Account } from '../entities';
import { ListAccountsQuery, PageResult } from '../dtos';

export interface IAccountRepository {
  createAndSave(data: Partial<Account>): Promise<Account>;
  updateAndSave(id: string, patch: Partial<Account>): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  findByAccountNumber(accountNumber: string): Promise<Account | null>;
  list(query: ListAccountsQuery): Promise<PageResult<Account>>;
  deleteHard(id: string): Promise<void>;
}

export class AccountRepository implements IAccountRepository {
  private repo: Repository<Account>;

  constructor(private readonly ds: DataSource) {
    this.repo = ds.getRepository(Account);
  }

  async createAndSave(data: Partial<Account>): Promise<Account> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async updateAndSave(id: string, patch: Partial<Account>): Promise<Account | null> {
    await this.repo.update({ id }, patch);
    return this.findById(id);
  }

  async findById(id: string): Promise<Account | null> {
    return this.repo.findOne({
      where: { id },
      relations: {
        billingAddress: true,
      },
    });
  }

  async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return this.repo.findOne({
      where: { accountNumber },
    });
  }

  async list(q: ListAccountsQuery): Promise<PageResult<Account>> {
    const { page, pageSize, sort, order } = q;

    let qb: SelectQueryBuilder<Account> = this.repo
      .createQueryBuilder('acc')
      .leftJoinAndSelect('acc.billingAddress', 'ba');

    if (q.q) {
      qb = qb.andWhere(
        '(acc.name LIKE :q OR acc.accountNumber LIKE :q OR acc.phone LIKE :q OR acc.payer LIKE :q OR acc.plan LIKE :q)',
        { q: `%${q.q}%` },
      );
    }
    if (q.accountNumber)
      qb = qb.andWhere('acc.accountNumber = :accountNumber', { accountNumber: q.accountNumber });
    if (q.type) qb = qb.andWhere('acc.type = :type', { type: q.type });
    if (typeof q.inHouse === 'boolean')
      qb = qb.andWhere('acc.inHouse = :inHouse', { inHouse: q.inHouse });
    if (typeof q.mdvitaDisenrollment === 'boolean')
      qb = qb.andWhere('acc.mdvitaDisenrollment = :mdvitaDisenrollment', {
        mdvitaDisenrollment: q.mdvitaDisenrollment,
      });
    if (q.payer) qb = qb.andWhere('acc.payer = :payer', { payer: q.payer });
    if (q.planType) qb = qb.andWhere('acc.planType = :planType', { planType: q.planType });

    qb = qb
      .orderBy(`acc.${sort}`, order)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async deleteHard(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
