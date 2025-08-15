// src/http/param.ts
import type { HttpRequest } from '@azure/functions';
import { z, type ZodTypeAny } from 'zod';

/** Common: { id: UUID } */
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

/** Build a { <name>: UUID } schema on the fly */
export const UuidParam = (name: string) =>
  z.object({ [name]: z.string().uuid() } as Record<string, z.ZodString>);

/** Parse route params with any Zod schema (throws ZodError on failure) */
export function parseParams<T extends ZodTypeAny>(req: HttpRequest, schema: T): z.infer<T> {
  const params = (req as any).params ?? {};
  const result = schema.safeParse(params);
  if (!result.success) throw result.error;
  return result.data as z.infer<T>;
}

/** Convenience: just get the {id} as a UUID */
export function getIdParam(req: HttpRequest): string {
  return IdParamSchema.parse((req as any).params ?? {}).id;
}

/** Examples for multi-param routes */
export const IdChildIdSchema = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
});
