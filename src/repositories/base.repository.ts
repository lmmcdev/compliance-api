import {
  DataSource,
  Repository,
  DeepPartial,
  FindOptionsWhere,
  FindOneOptions,
  FindOptionsOrder,
  EntityTarget,
  ObjectLiteral,
} from 'typeorm';

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BaseRepoOptions<T> {
  /** Default sort to apply when listing/paging (e.g. { createdAt: 'DESC' } ) */
  defaultOrder?: FindOptionsOrder<T>;
  /** Max page size guard (default 100) */
  maxPageSize?: number;
}

export class BaseRepository<T extends ObjectLiteral> {
  protected readonly repo: Repository<T>;
  protected readonly defaultOrder?: FindOptionsOrder<T>;
  protected readonly maxPageSize: number;

  constructor(ds: DataSource, entity: EntityTarget<T>, opts: BaseRepoOptions<T> = {}) {
    this.repo = ds.getRepository<T>(entity);
    this.defaultOrder = opts.defaultOrder;
    this.maxPageSize = opts.maxPageSize ?? 100;
  }

  /** Paged list; pass optional where/order to override defaults */
  async findPaged(
    page = 1,
    pageSize = 20,
    where?: FindOptionsWhere<T>,
    order?: FindOptionsOrder<T>,
  ): Promise<PageResult<T>> {
    const take = Math.max(1, Math.min(pageSize, this.maxPageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: order ?? this.defaultOrder,
      skip,
      take,
    });
    return { items, page, pageSize: take, total, totalPages: Math.ceil(total / take) };
  }

  /** Get one by id (or any custom options) */
  findById(id: string, options?: Omit<FindOneOptions<T>, 'where'>) {
    return this.repo.findOne({ where: { id } as unknown as FindOptionsWhere<T>, ...options });
  }

  /** Generic findOne with where/options */
  findOne(where: FindOptionsWhere<T>, options?: Omit<FindOneOptions<T>, 'where'>) {
    return this.repo.findOne({ where, ...options });
  }

  /** Create & save */
  createOne(data: DeepPartial<T>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  /** Patch & save by id; returns null if not found */
  async updateOne(id: string, data: DeepPartial<T>) {
    const existing = await this.findById(id);
    if (!existing) return null;
    Object.assign(existing as object, data as object);
    return this.repo.save(existing);
  }

  /** Soft delete (requires @DeleteDateColumn on the entity) */
  async softDelete(id: string) {
    await this.repo.softDelete(id);
  }

  /** Restore a soft-deleted row */
  async restore(id: string) {
    await this.repo.restore(id);
  }

  /** Hard delete (careful!) */
  async hardDelete(id: string) {
    await this.repo.delete(id);
  }

  /** Count with optional filter */
  count(where?: FindOptionsWhere<T>) {
    return this.repo.count({ where });
  }
}
