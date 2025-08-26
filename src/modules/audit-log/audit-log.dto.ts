import { z } from 'zod';

export const AuditActionEnum = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'READ',
  'LOGIN',
  'LOGOUT',
  'OTHER',
]);

export const AuditActorSchema = z
  .object({
    id: z.string().uuid().optional().nullable(),
    email: z.string().email().optional().nullable(),
    name: z.string().optional().nullable(),
    ip: z.string().optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

export const AuditContextSchema = z
  .object({
    traceId: z.string().optional().nullable(),
    requestId: z.string().optional().nullable(),
    method: z.string().optional().nullable(),
    path: z.string().optional().nullable(),
    status: z.number().int().optional().nullable(),
    userAgent: z.string().optional().nullable(),
  })
  .strict()
  .optional()
  .nullable();

export const AuditChangeSchema = z.object({
  path: z.string().min(1), // e.g. "displayName"
  from: z.any().optional(),
  to: z.any().optional(),
});

export const CreateAuditLogSchema = z
  .object({
    entityType: z.string().min(1),
    entityId: z.string().uuid(), // si no es UUID, cambia a z.string().min(1)
    action: AuditActionEnum,
    actor: AuditActorSchema,
    context: AuditContextSchema,
    changes: z.array(AuditChangeSchema).optional(),
    before: z.any().optional(),
    after: z.any().optional(),
    message: z.string().nullable().optional(),
  })
  .strict();

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;

export const ListAuditLogsSchema = z
  .object({
    // filtros
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    action: AuditActionEnum.optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    q: z.string().optional(), // busca en message

    // paginación
    limit: z.coerce.number().int().min(1).max(200).default(50),
    continuationToken: z.string().optional().nullable(),
  })
  .strict();

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsSchema>;
