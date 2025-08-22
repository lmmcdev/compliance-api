import { HttpRequest } from '@azure/functions';
import { ZodType } from 'zod';
import { ValidationError } from './app-error';

export async function parseJson<T extends ZodType>(
  req: HttpRequest,
  schema: T,
): Promise<ReturnType<T['parse']>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
  const result = schema.safeParse(body);
  if (!result.success) throw result.error;
  return result.data as any;
}

export function parseQuery<T extends ZodType>(req: HttpRequest, schema: T): ReturnType<T['parse']> {
  const q = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(q);
  if (!result.success) throw result.error;
  return result.data as any;
}
