import type { HttpRequest } from '@azure/functions';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from './app-error';
import { normalizeUuidsDeep } from './normalize';

export async function parseJson<T extends ZodTypeAny>(
  req: HttpRequest,
  schema: T,
): Promise<ReturnType<T['parse']>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  // Normaliza UUID-like (minúsculas) antes de Zod
  const preprocessed = normalizeUuidsDeep(body);

  const result = await schema.safeParseAsync(preprocessed);
  if (!result.success) {
    // Estandariza el error a tu shape
    throw new ValidationError('Validation failed', {
      fields: result.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }
  return result.data as any;
}

export async function parseQuery<T extends ZodTypeAny>(
  req: HttpRequest,
  schema: T,
): Promise<ReturnType<T['parse']>> {
  const url = new URL(req.url);
  const raw = searchParamsToObject(url.searchParams);

  // Normaliza UUID-like
  const preprocessed = normalizeUuidsDeep(raw);

  const result = await schema.safeParseAsync(preprocessed);
  if (!result.success) {
    throw new ValidationError('Validation failed', {
      fields: result.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
  }
  return result.data as any;
}

function searchParamsToObject(sp: URLSearchParams): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of sp.entries()) {
    if (k in obj) {
      const current = obj[k];
      if (Array.isArray(current)) obj[k] = [...current, v];
      else obj[k] = [current, v];
    } else {
      obj[k] = v;
    }
  }
  return obj;
}
