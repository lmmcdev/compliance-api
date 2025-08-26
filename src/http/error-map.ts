import { HttpResponseInit, InvocationContext } from '@azure/functions';
import { ZodError } from 'zod';
import { fail } from './respond';
import { AppError, ValidationError } from './app-error';
import { HTTP_STATUS } from './status';

export function mapErrorToResponse(ctx: InvocationContext, err: unknown): HttpResponseInit {
  if (err instanceof ZodError) {
    const fields = err.issues.map((e) => ({
      path: e.path.join('.') || '(root)',
      message: e.message,
      code: e.code,
    }));
    return fail(ctx, 422, 'VALIDATION_ERROR', 'Validation failed', undefined, fields);
  }

  if (err instanceof AppError) {
    return fail(ctx, err.status, err.code, err.message, err.details);
  }

  const safeMessage = err instanceof Error ? err.message : 'Internal Server Error';
  return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'INTERNAL_ERROR', safeMessage);
}
