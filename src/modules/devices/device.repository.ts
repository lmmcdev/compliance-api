import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { DeviceDoc } from './device.doc';

const CONTAINER_ID = 'lmmc_devices';
const PK_PATH = '/id';

export class DeviceRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  async findById(id: string): Promise<DeviceDoc | null> {
    try {
      const { resource } = await this.container.item(id, id).read<DeviceDoc>();
      if (!resource) return null;

      // Remove internal Cosmos DB fields
      const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = resource as any;
      return cleanDoc as DeviceDoc;
    } catch {
      return null;
    }
  }

  async list(opts?: {
    pageSize?: number;
    token?: string;
    doc_type?: string;
    Device_monitored?: string;
    Inventory_device_type?: string;
    Device_name?: string;
    q?: string; // Search query
  }): Promise<{ items: DeviceDoc[]; continuationToken: string | null }> {
    const {
      pageSize = 100,
      token,
      doc_type = 'lmmc_device',
      Device_monitored,
      Inventory_device_type,
      Device_name,
      q,
    } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    if (Device_monitored !== undefined) {
      filters.push('c.Device_monitored = @Device_monitored');
      params.push({ name: '@Device_monitored', value: Device_monitored });
    }

    if (Inventory_device_type) {
      filters.push('c.Inventory_device_type = @Inventory_device_type');
      params.push({ name: '@Inventory_device_type', value: Inventory_device_type });
    }

    if (Device_name) {
      filters.push('c.Device_name = @Device_name');
      params.push({ name: '@Device_name', value: Device_name });
    }

    if (q) {
      // Search across device name, hostname, equipment number
      filters.push('(CONTAINS(LOWER(c.Device_name), @q) OR CONTAINS(LOWER(c.Hostname), @q) OR CONTAINS(LOWER(c.equipmentNumber), @q))');
      params.push({ name: '@q', value: q.toLowerCase() });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT * FROM c ${whereClause}`,
      parameters: params,
    };

    const iter = this.container.items.query<DeviceDoc>(query, {
      maxItemCount: pageSize,
      continuationToken: token,
    });

    const { resources, continuationToken } = await iter.fetchNext();

    console.log('Device query result:', {
      requestedPageSize: pageSize,
      returnedItems: resources?.length || 0,
      hasContinuationToken: !!continuationToken,
    });

    // Remove internal Cosmos DB fields from all items
    const cleanItems = resources?.map((item: any) => {
      const { _rid, _self, _etag, _attachments, _ts, ...cleanDoc } = item;
      return cleanDoc as DeviceDoc;
    }) || [];

    return {
      items: cleanItems,
      continuationToken: continuationToken ?? null,
    };
  }

  async count(opts?: {
    doc_type?: string;
    Device_monitored?: string;
    Inventory_device_type?: string;
    Site_name?: string;
  }): Promise<number> {
    const {
      doc_type = 'lmmc_device',
      Device_monitored,
      Inventory_device_type,
      Site_name,
    } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    if (Device_monitored !== undefined) {
      filters.push('c.Device_monitored = @Device_monitored');
      params.push({ name: '@Device_monitored', value: Device_monitored });
    }

    if (Inventory_device_type) {
      filters.push('c.Inventory_device_type = @Inventory_device_type');
      params.push({ name: '@Inventory_device_type', value: Inventory_device_type });
    }

    if (Site_name) {
      filters.push('c.Site_name = @Site_name');
      params.push({ name: '@Site_name', value: Site_name });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
      parameters: params,
    };

    const { resources } = await this.container.items.query<number>(query).fetchAll();

    console.log('Device count result:', {
      count: resources[0] || 0,
      filters: opts,
    });

    return resources[0] || 0;
  }

  async countBySite(opts?: {
    doc_type?: string;
    Device_monitored?: string;
    Inventory_device_type?: string;
    Site_name?: string;
  }): Promise<{ siteName: string; count: number }[]> {
    const {
      doc_type = 'lmmc_device',
      Device_monitored,
      Inventory_device_type,
      Site_name,
    } = opts ?? {};

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    if (Device_monitored !== undefined) {
      filters.push('c.Device_monitored = @Device_monitored');
      params.push({ name: '@Device_monitored', value: Device_monitored });
    }

    if (Inventory_device_type) {
      filters.push('c.Inventory_device_type = @Inventory_device_type');
      params.push({ name: '@Inventory_device_type', value: Inventory_device_type });
    }

    if (Site_name) {
      filters.push('c.Site_name = @Site_name');
      params.push({ name: '@Site_name', value: Site_name });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT c.Site_name as siteName, COUNT(1) as count FROM c ${whereClause} GROUP BY c.Site_name`,
      parameters: params,
    };

    const { resources } = await this.container.items.query<{ siteName: string; count: number }>(query).fetchAll();

    console.log('Device count by site result:', {
      sitesCount: resources?.length || 0,
      filters: opts,
    });

    // Sort by count descending, then by site name
    const sortedResults = (resources || []).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (a.siteName || '').localeCompare(b.siteName || '');
    });

    return sortedResults;
  }

  async getDevicesBySite(opts: {
    doc_type?: string;
    Device_monitored?: string;
    Inventory_device_type?: string;
    Site_name: string;
  }): Promise<{ Device_name: string; Hostname?: string }[]> {
    const {
      doc_type = 'lmmc_device',
      Device_monitored,
      Inventory_device_type,
      Site_name,
    } = opts;

    const filters: string[] = [];
    const params: { name: string; value: any }[] = [];

    // Always filter by doc_type
    filters.push('c.doc_type = @doc_type');
    params.push({ name: '@doc_type', value: doc_type });

    // Site_name is required
    filters.push('c.Site_name = @Site_name');
    params.push({ name: '@Site_name', value: Site_name });

    if (Device_monitored !== undefined) {
      filters.push('c.Device_monitored = @Device_monitored');
      params.push({ name: '@Device_monitored', value: Device_monitored });
    }

    if (Inventory_device_type) {
      filters.push('c.Inventory_device_type = @Inventory_device_type');
      params.push({ name: '@Inventory_device_type', value: Inventory_device_type });
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const query: SqlQuerySpec = {
      query: `SELECT c.Device_name, c.Hostname FROM c ${whereClause}`,
      parameters: params,
    };

    const { resources } = await this.container.items.query<{ Device_name: string; Hostname?: string }>(query).fetchAll();

    console.log('Devices by site result:', {
      siteName: Site_name,
      deviceCount: resources?.length || 0,
      filters: opts,
    });

    return resources || [];
  }
}
