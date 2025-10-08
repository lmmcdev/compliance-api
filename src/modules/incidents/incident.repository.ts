import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { IncidentDoc, ComplianceIncidentDoc } from './incident.doc';
import { randomUUID } from 'crypto';
import { ConflictError } from '../../http';

const CONTAINER_ID = 'incidents';
const PK_PATH = '/incidentNumber';

export class IncidentRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async findByIncidentNumber(incidentNumber: string): Promise<IncidentDoc | null> {
    try {
      const { resources } = await this.container.items
        .query<IncidentDoc>({
          query: 'SELECT * FROM c WHERE c.incidentNumber = @incidentNumber',
          parameters: [{ name: '@incidentNumber', value: incidentNumber }],
        })
        .fetchNext();
      return resources && resources.length > 0 ? (resources[0] as IncidentDoc) : null;
    } catch {
      return null;
    }
  }

  async create(data: Omit<IncidentDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<IncidentDoc> {
    const { incidentNumber } = data;
    const existing = await this.findByIncidentNumber(incidentNumber);
    if (existing)
      throw new ConflictError(`Incident with incidentNumber ${incidentNumber} already exists`);

    const now = new Date().toISOString();
    let doc: IncidentDoc;

    if (data.doc_type === 'compliance_incident') {
      doc = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...data,
        reportedAt: (data as any).reportedAt || now,
      } as IncidentDoc;
    } else {
      doc = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...data,
      } as IncidentDoc;
    }

    const { resource } = await this.container.items.create(doc);
    return resource as IncidentDoc;
  }

  async findById(id: string, incidentNumber: string): Promise<IncidentDoc | null> {
    try {
      const { resource } = await this.container.item(id, incidentNumber).read<IncidentDoc>();
      return resource ? (resource as IncidentDoc) : null;
    } catch {
      return null;
    }
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    q?: string;
    doc_type?: string;
    // IT incident filters
    Ticket_priority?: string;
    Activity_status?: string;
    Ticket_type?: string;
    // Compliance incident filters
    severity?: string;
    status?: string;
    assignedTo?: string;
    sort?: 'createdAt' | 'updatedAt' | 'Ticket_resolved_Date' | 'reportedAt';
    order?: 'ASC' | 'DESC';
  }): Promise<{ items: IncidentDoc[]; continuationToken: string | null }> {
    const {
      pageSize = 10, // Set smaller default for testing pagination
      token,
      q,
      doc_type = 'it_incident', // Default to it_incident
      Ticket_priority,
      Activity_status,
      Ticket_type,
      severity,
      status,
      assignedTo,
      sort = 'createdAt',
      order = 'DESC',
    } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type (defaults to 'it_incident')
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    if (q) {
      // Search across different fields based on doc_type or general fields
      filters.push('(CONTAINS(LOWER(c.Ticket_title), @q) OR CONTAINS(LOWER(c.title), @q) OR CONTAINS(LOWER(c.incidentNumber), @q) OR CONTAINS(LOWER(c.Ticket_number), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }

    // IT incident specific filters
    if (Ticket_priority) {
      filters.push('c.Ticket_priority = @Ticket_priority');
      params.push({ name: '@Ticket_priority', value: Ticket_priority });
    }
    if (Activity_status) {
      filters.push('c.Activity_status = @Activity_status');
      params.push({ name: '@Activity_status', value: Activity_status });
    }
    if (Ticket_type) {
      filters.push('c.Ticket_type = @Ticket_type');
      params.push({ name: '@Ticket_type', value: Ticket_type });
    }

    // Compliance incident specific filters
    if (severity) {
      filters.push('c.severity = @severity');
      params.push({ name: '@severity', value: severity });
    }
    if (status) {
      filters.push('c.status = @status');
      params.push({ name: '@status', value: status });
    }
    if (assignedTo) {
      filters.push('c.assignedTo = @assignedTo');
      params.push({ name: '@assignedTo', value: assignedTo });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT * FROM c ${whereClause}`,
      parameters: params,
    };

    const iter = this.container.items.query<IncidentDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
      // Cross-partition query - spans multiple incidentNumbers
      // Note: Cross-partition queries are enabled by default when no partitionKey is specified
    });

    const { resources, continuationToken } = await iter.fetchNext();

    // Debug logging
    console.log('Incidents query result:', {
      requestedPageSize: pageSize,
      returnedItems: resources?.length || 0,
      hasContinuationToken: !!continuationToken,
      continuationTokenLength: continuationToken?.length || 0
    });

    return {
      items: resources ? resources.map((item) => item as IncidentDoc) : [],
      continuationToken: continuationToken ?? null,
    };
  }

  async update(
    id: string,
    incidentNumber: string,
    patch: Partial<Omit<IncidentDoc, 'id' | 'createdAt' | 'incidentNumber'>>,
  ): Promise<IncidentDoc | null> {
    const current = await this.findById(id, incidentNumber);
    if (!current) return null;

    let updated: IncidentDoc = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    } as IncidentDoc;

    // Auto-set resolvedAt for compliance incidents when status changes to resolved/closed
    if (current.doc_type === 'compliance_incident' && 'status' in patch) {
      const compliancePatch = patch as Partial<ComplianceIncidentDoc>;
      if (compliancePatch.status === 'resolved' || compliancePatch.status === 'closed') {
        (updated as ComplianceIncidentDoc).resolvedAt = compliancePatch.resolvedAt || new Date().toISOString();
      }
    }

    const { resource } = await this.container.item(id, incidentNumber).replace(updated);
    return resource as IncidentDoc;
  }

  async delete(id: string, incidentNumber: string): Promise<void> {
    await this.container.item(id, incidentNumber).delete();
  }
}