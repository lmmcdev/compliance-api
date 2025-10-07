import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { WindowsPatchDoc } from './windows-patch.doc';

const CONTAINER_ID = 'windows_reports';
const PK_PATH = '/id';

export class WindowsPatchRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    doc_type?: string;
    Classification?: string;
    Patch_status?: string;
    Site_name?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: WindowsPatchDoc[]; continuationToken: string | null }> {
    const {
      pageSize = 100,
      token,
      doc_type = 'windows_patch',
      Classification,
      Patch_status,
      Site_name,
      startDate,
      endDate,
    } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    if (Classification) {
      filters.push('c.Classification = @Classification');
      params.push({ name: '@Classification', value: Classification });
    }

    if (Patch_status) {
      filters.push('c.Patch_status = @Patch_status');
      params.push({ name: '@Patch_status', value: Patch_status });
    }

    if (Site_name) {
      filters.push('c.Site_name = @Site_name');
      params.push({ name: '@Site_name', value: Site_name });
    }

    // Normalize date filtering to handle different formats
    // Using STARTSWITH for month filtering and >= <= for exact dates
    if (startDate) {
      // For YYYY-MM format, use STARTSWITH
      if (startDate.length === 7 && startDate.match(/^\d{4}-\d{2}$/)) {
        filters.push('STARTSWITH(c.Patch_installation_Date, @startDate)');
        params.push({ name: '@startDate', value: startDate });
      } else {
        // For YYYY-MM-DD format, use >= comparison
        filters.push('c.Patch_installation_Date >= @startDate');
        params.push({ name: '@startDate', value: startDate });
      }
    }

    if (endDate) {
      filters.push('c.Patch_installation_Date <= @endDate');
      params.push({ name: '@endDate', value: endDate });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT * FROM c ${whereClause}`,
      parameters: params,
    };

    const iter = this.container.items.query<WindowsPatchDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
    });

    const { resources, continuationToken } = await iter.fetchNext();

    console.log('Windows Patch query result:', {
      requestedPageSize: pageSize,
      returnedItems: resources?.length || 0,
      hasContinuationToken: !!continuationToken,
    });

    return {
      items: resources ? resources.map((item) => item as WindowsPatchDoc) : [],
      continuationToken: continuationToken ?? null,
    };
  }
}
