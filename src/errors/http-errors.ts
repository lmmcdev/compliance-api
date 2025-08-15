export class NotFoundError extends Error {
  status = 404 as const;
  constructor(msg = 'Not found') {
    super(msg);
  }
}

export class ConflictError extends Error {
  status = 409 as const;
  constructor(msg = 'Conflict') {
    super(msg);
  }
}
