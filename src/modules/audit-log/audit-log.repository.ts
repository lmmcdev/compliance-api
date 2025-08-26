import { CosmosClient, Container, SqlParameter, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'crypto';
import { CreateAuditLogDto, ListAuditLogsQuery } from './audit-log.dto';
import { AuditLogDoc } from './audit-log.doc';

const buildPk = (entityType: string, entityId: string) => `${entityType}:${entityId}`;

export class AuditLogRepository {
  private container!: Container;

  async init(): Promise<this> {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key = process.env.COSMOS_KEY!;
    const dbId = process.env.COSMOS_DB!;
    const containerId = process.env.COSMOS_CONTAINER_AUDIT ?? 'audit_logs';
    const defaultTtlSeconds = Number(process.env.AUDIT_LOG_TTL_SECONDS ?? 220_752_000); // ~7 años

    const client = new CosmosClient({ endpoint, key });
    const { database } = await client.databases.createIfNotExists({ id: dbId });

    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ['/pk'] },
      defaultTtl: defaultTtlSeconds,
      indexingPolicy: {
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        excludedPaths: [{ path: '/"before"/*' }, { path: '/"after"/*' }], // reduce RU si son grandes
      },
    });

    this.container = container;
    return this;
  }

  async create(dto: CreateAuditLogDto): Promise<AuditLogDoc> {
    const now = new Date();
    const doc: AuditLogDoc = {
      id: randomUUID(),
      pk: buildPk(dto.entityType, dto.entityId),

      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      actor: dto.actor ?? undefined,
      context: dto.context ?? undefined,
      changes: dto.changes ?? undefined,
      before: dto.before ?? undefined,
      after: dto.after ?? undefined,
      message: dto.message ?? null,

      // BaseDoc (habituales)
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: dto.actor?.id ?? null,
      updatedBy: dto.actor?.id ?? null,
    } as AuditLogDoc;

    const { resource } = await this.container.items.create(doc, {
      disableAutomaticIdGeneration: true,
    });
    return resource as AuditLogDoc;
  }

  async list(
    q: ListAuditLogsQuery,
  ): Promise<{ items: AuditLogDoc[]; continuationToken: string | null }> {
    // Si viene entityType + entityId, podemos usar pk → mucho más eficiente
    const hasPk = q.entityType && q.entityId;
    const params: SqlParameter[] = [];
    let sql = 'SELECT * FROM c WHERE 1 = 1';

    if (q.entityType) {
      sql += ' AND c.entityType = @entityType';
      params.push({ name: '@entityType', value: q.entityType });
    }
    if (q.entityId) {
      sql += ' AND c.entityId = @entityId';
      params.push({ name: '@entityId', value: q.entityId });
    }
    if (q.action) {
      sql += ' AND c.action = @action';
      params.push({ name: '@action', value: q.action });
    }
    if (q.from) {
      sql += ' AND c.createdAt >= @from';
      params.push({ name: '@from', value: q.from });
    }
    if (q.to) {
      sql += ' AND c.createdAt <= @to';
      params.push({ name: '@to', value: q.to });
    }
    if (q.q) {
      sql += ' AND IS_STRING(c.message) AND CONTAINS(c.message, @q, true)';
      params.push({ name: '@q', value: q.q });
    }

    sql += ' ORDER BY c.createdAt DESC';

    const query: SqlQuerySpec = { query: sql, parameters: params };
    const iterator = this.container.items.query<AuditLogDoc>(query, {
      maxItemCount: q.limit,
      partitionKey: hasPk ? (buildPk(q.entityType!, q.entityId!) as any) : undefined,
    });

    const { resources, continuationToken } = await iterator.fetchNext();
    return { items: resources, continuationToken: continuationToken ?? null };
  }
}
