// src/modules/audit-log/audit-log.dto.ts
import { z } from 'zod';

export const AuditActorSchema = z
  .object({
    id: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    name: z.string().optional().nullable(),
    ip: z.string().optional().nullable(),
  })
  .strict()
  .partial();

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
  .partial();

export const AuditChangeSchema = z.object({
  path: z.string(),
  from: z.unknown().optional(),
  to: z.unknown().optional(),
});

export const CreateAuditLogSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT', 'OTHER']),
  actor: AuditActorSchema.optional(),
  context: AuditContextSchema.optional(),
  changes: z.array(AuditChangeSchema).optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  message: z.string().nullable().optional(),
});

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;

export const ListAuditLogsSchema = z.object({
  // Filters
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'READ', 'LOGIN', 'LOGOUT', 'OTHER']).optional(),
  actorId: z.string().optional(),
  traceId: z.string().optional(),
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(),

  // Paging
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  token: z.string().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsSchema>;
