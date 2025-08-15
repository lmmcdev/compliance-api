import { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';
import { QueryFailedError } from 'typeorm';
import { fail } from './respond';
import { AppError, ValidationError } from './app-error';
import { HTTP_STATUS } from './status';

export function mapErrorToResponse(ctx: InvocationContext, err: unknown): HttpResponseInit {
  // Zod validation
  if (err instanceof ZodError) {
    const fields = err.issues.map((e) => ({
      path: e.path.join('.') || '(root)',
      message: e.message,
      code: e.code,
    }));
    return fail(ctx, 422, 'VALIDATION_ERROR', 'Validation failed', undefined, fields);
  }

  // Your AppError hierarchy
  if (err instanceof AppError) {
    return fail(ctx, err.status, err.code, err.message, err.details);
  }

  // TypeORM query-level failures (duplicate key, FK, etc.)
  if (err instanceof QueryFailedError) {
    const n = (err as any).driverError?.number as number | undefined;
    if (n === 2627 || n === 2601) {
      // unique constraint / dup key
      return fail(ctx, 409, 'DB_UNIQUE_VIOLATION', 'Duplicate value violates a unique constraint');
    }
    if (n === 547) {
      // FK violation
      return fail(ctx, 400, 'DB_FOREIGN_KEY_VIOLATION', 'Foreign key constraint failed');
    }
    if (n === 515) {
      // cannot insert NULL
      return fail(ctx, 422, 'DB_NOT_NULL_VIOLATION', 'A required field was null');
    }
    // fallback
    return fail(ctx, 400, 'DB_QUERY_FAILED', 'Database query failed', {
      number: n,
      errorMessage: err.message,
    });
  }

  // Unknown => 500
  const safeMessage = err instanceof Error ? err.message : 'Internal Server Error';
  return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'INTERNAL_ERROR', safeMessage);
}
