export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Meta = {
  traceId: string;
  pagination?: PaginationMeta;
  // add more fields if needed (e.g., timing)
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Meta;
};

export type ApiError = {
  success: false;
  error: {
    code: string; // MACHINE_READABLE_CODE
    message: string; // human-readable
    details?: unknown; // optional internal details (safe)
    fields?: Array<{
      path: string;
      message: string;
      code?: string;
    }>;
  };
  meta?: Meta;
};
