import type { HttpRequest } from '@azure/functions';
import { z, ZodType } from 'zod';

export const IdParamSchema = z.object({
  id: z.uuid(),
});

export const UuidParam = (name: string) =>
  z.object({ [name]: z.uuid() } as unknown as Record<string, z.ZodString>);

export function parseParams<T extends ZodType>(req: HttpRequest, schema: T): z.infer<T> {
  const params = (req as any).params ?? {};
  const result = schema.safeParse(params);
  if (!result.success) throw result.error;
  return result.data as z.infer<T>;
}

export function getIdParam(req: HttpRequest): string {
  return IdParamSchema.parse((req as any).params ?? {}).id;
}

export const IdChildIdSchema = z.object({
  id: z.uuid(),
  childId: z.uuid(),
});
