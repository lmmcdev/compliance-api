// src/modules/audit-log/audit-log.repository.ts
import { Container, SqlQuerySpec } from '@azure/cosmos';
import { randomUUID } from 'crypto';
import { getContainer } from '../../infrastructure/cosmos';
import { AuditLogDoc } from './audit-log.doc';

const CONTAINER_ID = 'audit_logs';
const PK_PATH = '/pk';

function makePk(entityType: string, entityId: string) {
  return `${entityType}:${entityId}`;
}

export class AuditLogRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async create(
    data: Omit<AuditLogDoc, 'id' | 'createdAt' | 'updatedAt' | 'pk'>,
  ): Promise<AuditLogDoc> {
    const now = new Date().toISOString();
    const pk = makePk(data.entityType, data.entityId);
    const doc: AuditLogDoc = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      pk,
      ...data,
    };
    const { resource } = await this.container.items.create(doc);
    return resource as AuditLogDoc;
  }

  /**
   * List with filters. If both entityType & entityId are provided, we add `partitionKey`
   * to keep it single-partition and cheap.
   */
  async list(opts: {
    entityType?: string;
    entityId?: string;
    action?: string;
    actorId?: string;
    traceId?: string;
    from?: string;
    to?: string;
    pageSize?: number;
    token?: string;
  }): Promise<{ items: AuditLogDoc[]; continuationToken: string | null }> {
    const { entityType, entityId, action, actorId, traceId, from, to, pageSize = 50, token } = opts;

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    if (entityType) {
      filters.push('c.entityType = @entityType');
      params.push({ name: '@entityType', value: entityType });
    }
    if (entityId) {
      filters.push('c.entityId = @entityId');
      params.push({ name: '@entityId', value: entityId });
    }
    if (action) {
      filters.push('c.action = @action');
      params.push({ name: '@action', value: action });
    }
    if (actorId) {
      filters.push('c.actor.id = @actorId');
      params.push({ name: '@actorId', value: actorId });
    }
    if (traceId) {
      filters.push('c.context.traceId = @traceId');
      params.push({ name: '@traceId', value: traceId });
    }
    if (from) {
      filters.push('c.createdAt >= @from');
      params.push({ name: '@from', value: from });
    }
    if (to) {
      filters.push('c.createdAt <= @to');
      params.push({ name: '@to', value: to });
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const query: SqlQuerySpec = {
      query: `
        SELECT c.id, c.pk, c.entityType, c.entityId, c.action, c.actor, c.context,
               c.changes, c.before, c.after, c.message, c.createdAt, c.updatedAt
        FROM c
        ${where}
        ORDER BY c.createdAt DESC
      `,
      parameters: params,
    };

    const queryOptions: any = {
      maxItemCount: pageSize,
      continuationToken: token,
    };

    // If we know the exact partition key, pin the query to it for low RUs
    if (entityType && entityId) queryOptions.partitionKey = makePk(entityType, entityId);

    const iter = this.container.items.query<AuditLogDoc>(query, queryOptions);
    const { resources, continuationToken } = await iter.fetchNext();

    return { items: resources as AuditLogDoc[], continuationToken: continuationToken ?? null };
  }
}
