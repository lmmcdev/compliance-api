export type Id = string;

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ListQuery {
  page?: number;
  pageSize?: number;
}
