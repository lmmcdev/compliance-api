// src/modules/audit-log/audit-log.doc.ts
import { BaseDoc } from '../../shared/base.doc';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'LOGIN' | 'LOGOUT' | 'OTHER';

export interface AuditActor {
  id?: string | null; // user id (if known)
  email?: string | null;
  name?: string | null;
  ip?: string | null;
}

export interface AuditContext {
  traceId?: string | null; // your existing traceId
  requestId?: string | null;
  method?: string | null; // GET/POST...
  path?: string | null; // /api/v1/...
  status?: number | null; // HTTP status code
  userAgent?: string | null;
}

export interface AuditChange {
  path: string; // e.g. "displayName"
  from?: unknown;
  to?: unknown;
}

export interface AuditLogDoc extends BaseDoc {
  /** Partition key for Cosmos: "${entityType}:${entityId}" */
  pk: string;

  /** Entity info */
  entityType: string; // e.g. "address", "location", "licenseType"
  entityId: string; // the target entity id

  /** Action and actor */
  action: AuditAction;
  actor?: AuditActor;

  /** Context */
  context?: AuditContext;

  /** Optional payloads */
  changes?: AuditChange[]; // precomputed small diff
  before?: unknown; // small snapshot subset (avoid huge objects)
  after?: unknown; // small snapshot subset
  message?: string | null; // free-form note
}
