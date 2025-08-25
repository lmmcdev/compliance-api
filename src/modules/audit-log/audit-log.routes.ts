// src/modules/audit-log/audit-log.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { created, createPrefixRoute, ok, parseJson, parseQuery, withHttp } from '../../http';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogSchema, ListAuditLogsSchema } from './audit-log.dto';

const path = 'audit-logs';
const { prefixRoute } = createPrefixRoute(path);

// GET /api/v1/audit-logs?entityType=&entityId=&action=&actorId=&traceId=&from=&to=&pageSize=&token=
export const auditLogsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const q = await parseQuery(req, ListAuditLogsSchema);
    const svc = await AuditLogService.createInstance();
    const page = await svc.list(q);
    return ok(ctx, page);
  },
);

// POST /api/v1/audit-logs  (optionally expose for testing/manual logs)
export const auditLogsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await parseJson(req, CreateAuditLogSchema);
    const svc = await AuditLogService.createInstance();
    const doc = await svc.log(body);
    return created(ctx, doc);
  },
);

app.http('audit-logs-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: auditLogsListHandler,
});

app.http('audit-logs-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: auditLogsCreateHandler,
});
