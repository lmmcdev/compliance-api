import { Id, ListQuery, PageResult } from './types';

// shared/crud-service.ts
export interface CrudService<
  TEntity,
  TCreate,
  TUpdate = Partial<TCreate>,
  TQuery = ListQuery,
  TId = Id,
> {
  create(payload: TCreate): Promise<TEntity>;
  update(id: TId, payload: TUpdate): Promise<TEntity>;
  get(id: TId): Promise<TEntity>;
  list(query: TQuery): Promise<PageResult<TEntity>>;
  remove(id: TId): Promise<void>;
}
