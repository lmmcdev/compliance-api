// src/modules/audit-log/audit.ts
import { InvocationContext } from '@azure/functions';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './audit-log.dto';

export async function audit(
  ctx: InvocationContext,
  entry: Omit<CreateAuditLogDto, 'context'> & { context?: CreateAuditLogDto['context'] },
) {
  const svc = await AuditLogService.createInstance();
  const traceId = (ctx as any)?.traceId || (ctx as any)?.invocationId || undefined;
  const payload: CreateAuditLogDto = {
    ...entry,
    context: {
      traceId,
      ...(entry.context ?? {}),
    },
  };
  await svc.log(payload);
}
