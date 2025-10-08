import { Container } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { PatchSummaryDoc } from './patch-summary.doc';

const CONTAINER_ID = 'windows_reports';
const PK_PATH = '/id';

export class PatchSummaryRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  /**
   * Upsert (create or update) a patch summary document
   */
  async upsertSummary(summary: PatchSummaryDoc): Promise<PatchSummaryDoc> {
    const { resource } = await this.container.items.upsert(summary);

    console.log('Patch summary upserted:', {
      id: summary.id,
      KB_number: summary.KB_number,
      Site_name: summary.Site_name,
      Device_count: summary.Device_count,
    });

    return resource as PatchSummaryDoc;
  }

  /**
   * Get unique sites from windows_patch documents for a specific date
   */
  async getSitesForDate(date: string): Promise<string[]> {
    const query = {
      query: 'SELECT DISTINCT VALUE c.Site_name FROM c WHERE c.doc_type = @doc_type AND c.Patch_installation_Date = @date',
      parameters: [
        { name: '@doc_type', value: 'windows_patch' },
        { name: '@date', value: date },
      ],
    };

    const { resources } = await this.container.items.query<string>(query).fetchAll();

    console.log('Sites found for date:', {
      date,
      sitesCount: resources?.length || 0,
    });

    return resources || [];
  }

  /**
   * Get aggregated patch data by KB_number for a specific site and date
   */
  async getPatchDataBySiteAndDate(site: string, date: string): Promise<{
    KB_number: string;
    Patch_name: string;
    Classification: string;
    Patch_status: string;
    Device_count: number;
  }[]> {
    const query = {
      query: `SELECT
                c.KB_number,
                c.Patch_name,
                c.Classification,
                c.Patch_status,
                c.Device_name
              FROM c
              WHERE c.doc_type = @doc_type
              AND c.Site_name = @site
              AND c.Patch_installation_Date = @date`,
      parameters: [
        { name: '@doc_type', value: 'windows_patch' },
        { name: '@site', value: site },
        { name: '@date', value: date },
      ],
    };

    const { resources } = await this.container.items
      .query<{
        KB_number: string;
        Patch_name: string;
        Classification: string;
        Patch_status: string;
        Device_name: string;
      }>(query)
      .fetchAll();

    console.log('Patch data fetched:', {
      site,
      date,
      recordsCount: resources?.length || 0,
    });

    // Group by KB_number and aggregate
    const kbMap = new Map<string, {
      Patch_name: string;
      Classification: string;
      statusCounts: Map<string, number>;
      devices: Set<string>;
    }>();

    (resources || []).forEach((item) => {
      if (!kbMap.has(item.KB_number)) {
        kbMap.set(item.KB_number, {
          Patch_name: item.Patch_name,
          Classification: item.Classification,
          statusCounts: new Map(),
          devices: new Set(),
        });
      }

      const kbData = kbMap.get(item.KB_number)!;
      kbData.devices.add(item.Device_name);

      // Count status occurrences
      const currentCount = kbData.statusCounts.get(item.Patch_status) || 0;
      kbData.statusCounts.set(item.Patch_status, currentCount + 1);
    });

    // Convert to array with most common status
    const result = Array.from(kbMap.entries()).map(([KB_number, data]) => {
      // Find most common status
      let mostCommonStatus = 'Unknown';
      let maxCount = 0;

      data.statusCounts.forEach((count, status) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonStatus = status;
        }
      });

      return {
        KB_number,
        Patch_name: data.Patch_name,
        Classification: data.Classification,
        Patch_status: mostCommonStatus,
        Device_count: data.devices.size,
      };
    });

    console.log('Aggregated KB data:', {
      site,
      date,
      uniqueKBs: result.length,
    });

    return result;
  }
}
