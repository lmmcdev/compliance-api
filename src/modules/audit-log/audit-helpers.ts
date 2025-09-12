import { HttpRequest } from '@azure/functions';
import { AuditChange, AuditLogDoc } from './audit-log.doc';
import { AuditLogService } from './audit-log.service';

export function actorFromReq(req: HttpRequest) {
  return {
    id: req.headers.get('x-user-id') ?? null,
    email: req.headers.get('x-user-email') ?? null,
    name: req.headers.get('x-user-name') ?? null,
    ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-client-ip') ?? null,
  };
}

export function contextFromReq(req: HttpRequest, status?: number) {
  return {
    traceId: req.headers.get('x-trace-id') ?? null,
    requestId: req.headers.get('x-request-id') ?? null,
    method: req.method ?? null,
    path: new URL(req.url).pathname,
    status: status ?? null,
    userAgent: req.headers.get('user-agent') ?? null,
  };
}

export function shallowDiff(
  before: any,
  after: any,
  pickKeys?: string[],
): { changes: AuditChange[]; beforeMini: any; afterMini: any } {
  const keys =
    pickKeys ?? Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  const changes: AuditChange[] = [];
  const bMini: any = {};
  const aMini: any = {};
  for (const k of keys) {
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes.push({ path: k, from: b, to: a });
      bMini[k] = b;
      aMini[k] = a;
    }
  }
  return { changes, beforeMini: bMini, afterMini: aMini };
}

/** Nunca lanza: no rompe el flujo de negocio si falló auditar */
export async function safeAuditLog(input: {
  entityType: string;
  entityId: string;
  action: AuditLogDoc['action'];
  req?: HttpRequest;
  message?: string | null;
  status?: number;
  changes?: AuditChange[];
  before?: unknown;
  after?: unknown;
}) {
  try {
    const svc = await AuditLogService.createInstance();
    await svc.log({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actor: input.req ? actorFromReq(input.req) : undefined,
      context: input.req ? contextFromReq(input.req, input.status) : undefined,
      message: input.message ?? null,
      changes: input.changes,
      before: input.before,
      after: input.after,
    });
  } catch (e) {
    console.error('[AUDIT_LOG_ERROR]', e);
  }
}
