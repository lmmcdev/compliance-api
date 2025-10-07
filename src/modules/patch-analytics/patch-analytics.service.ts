import { InvocationContext } from '@azure/functions';
import {
  PatchAnalyticsRequest,
  PatchAnalyticsResponse,
  PatchTypeCompliance,
  TemporalTrendEntry,
  SiteComplianceEntry,
  KBGroupEntry,
} from './patch-analytics.dto';
import { WindowsPatchRepository } from './windows-patch.repository';
import { WindowsPatchDoc } from './windows-patch.doc';

export class PatchAnalyticsService {
  private constructor(
    private readonly patchRepository: WindowsPatchRepository,
  ) {}

  static async createInstance() {
    const patchRepository = await new WindowsPatchRepository().init();
    return new PatchAnalyticsService(patchRepository);
  }

  /**
   * Convert month (YYYY-MM) to date range
   */
  private getDateRangeFromMonth(month: string): { startDate: string; endDate: string } {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;

    // Calculate last day of month
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return { startDate, endDate };
  }

  /**
   * Fetch all patches from Cosmos DB with optional filters
   */
  private async fetchPatches(filters?: PatchAnalyticsRequest): Promise<WindowsPatchDoc[]> {
    const allPatches: WindowsPatchDoc[] = [];
    let continuationToken: string | null = null;

    // Convert month to date range if provided (and startDate/endDate not provided)
    let startDate = filters?.startDate;
    let endDate = filters?.endDate;

    if (filters?.month && !startDate && !endDate) {
      const dateRange = this.getDateRangeFromMonth(filters.month);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Fetch all pages
    do {
      const result = await this.patchRepository.list({
        pageSize: 100,
        token: continuationToken || undefined,
        Classification: filters?.Classification,
        Patch_status: filters?.Patch_status,
        Site_name: filters?.Site_name,
        startDate,
        endDate,
      });

      allPatches.push(...result.items);
      continuationToken = result.continuationToken;
    } while (continuationToken);

    return allPatches;
  }

  /**
   * Calculate compliance rate percentage
   */
  private calculateComplianceRate(installed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((installed / total) * 100 * 100) / 100; // Round to 2 decimals
  }

  /**
   * Generate compliance statistics by patch type (Classification)
   */
  private generateComplianceByPatchType(patches: WindowsPatchDoc[]): PatchTypeCompliance[] {
    const typeMap = new Map<string, { installed: number; pending: number; failed: number; total: number }>();

    patches.forEach((patch) => {
      const classification = patch.Classification || 'Unknown';

      if (!typeMap.has(classification)) {
        typeMap.set(classification, { installed: 0, pending: 0, failed: 0, total: 0 });
      }

      const stats = typeMap.get(classification)!;
      stats.total++;

      const status = patch.Patch_status?.toLowerCase() || '';
      if (status.includes('install') && !status.includes('pending')) {
        stats.installed++;
      } else if (status.includes('pending')) {
        stats.pending++;
      } else if (status.includes('fail')) {
        stats.failed++;
      }
    });

    const result: PatchTypeCompliance[] = [];
    typeMap.forEach((stats, patchType) => {
      result.push({
        patchType,
        totalPatches: stats.total,
        installed: stats.installed,
        pending: stats.pending,
        failed: stats.failed,
        complianceRate: this.calculateComplianceRate(stats.installed, stats.total),
      });
    });

    return result.sort((a, b) => b.totalPatches - a.totalPatches);
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  private normalizeDate(dateString: string | undefined): string {
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }

    // If already in YYYY-MM-DD format, return as-is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    // Try to parse as ISO string or other formats
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Return as-is if we can't normalize
    return dateString;
  }

  /**
   * Generate temporal trend of patch installations
   */
  private generateTemporalTrend(patches: WindowsPatchDoc[]): TemporalTrendEntry[] {
    const dateMap = new Map<string, {
      installed: number;
      pending: number;
      failed: number;
      total: number;
      byClassification: Map<string, { installed: number; pending: number; failed: number; total: number }>;
    }>();

    patches.forEach((patch) => {
      const date = this.normalizeDate(patch.Patch_installation_Date || patch.last_updated);
      const classification = patch.Classification || 'Unknown';
      const status = patch.Patch_status?.toLowerCase() || '';

      if (!dateMap.has(date)) {
        dateMap.set(date, {
          installed: 0,
          pending: 0,
          failed: 0,
          total: 0,
          byClassification: new Map(),
        });
      }

      const dayStats = dateMap.get(date)!;
      dayStats.total++;

      if (status.includes('install') && !status.includes('pending')) {
        dayStats.installed++;
      } else if (status.includes('pending')) {
        dayStats.pending++;
      } else if (status.includes('fail')) {
        dayStats.failed++;
      }

      // Track by classification
      if (!dayStats.byClassification.has(classification)) {
        dayStats.byClassification.set(classification, { installed: 0, pending: 0, failed: 0, total: 0 });
      }

      const classStats = dayStats.byClassification.get(classification)!;
      classStats.total++;

      if (status.includes('install') && !status.includes('pending')) {
        classStats.installed++;
      } else if (status.includes('pending')) {
        classStats.pending++;
      } else if (status.includes('fail')) {
        classStats.failed++;
      }
    });

    const result: TemporalTrendEntry[] = [];
    dateMap.forEach((stats, date) => {
      const byClassification: { [key: string]: any } = {};
      stats.byClassification.forEach((classStats, classification) => {
        byClassification[classification] = {
          installed: classStats.installed,
          pending: classStats.pending,
          failed: classStats.failed,
          total: classStats.total,
        };
      });

      result.push({
        date,
        installed: stats.installed,
        pending: stats.pending,
        failed: stats.failed,
        total: stats.total,
        byClassification,
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate compliance status by site
   */
  private generateComplianceBySite(patches: WindowsPatchDoc[]): SiteComplianceEntry[] {
    const siteMap = new Map<string, {
      installed: number;
      pending: number;
      failed: number;
      total: number;
      byClassification: Map<string, { installed: number; pending: number; failed: number; total: number }>;
    }>();

    patches.forEach((patch) => {
      const site = patch.Site_name || 'Unknown';
      const classification = patch.Classification || 'Unknown';
      const status = patch.Patch_status?.toLowerCase() || '';

      if (!siteMap.has(site)) {
        siteMap.set(site, {
          installed: 0,
          pending: 0,
          failed: 0,
          total: 0,
          byClassification: new Map(),
        });
      }

      const siteStats = siteMap.get(site)!;
      siteStats.total++;

      if (status.includes('install') && !status.includes('pending')) {
        siteStats.installed++;
      } else if (status.includes('pending')) {
        siteStats.pending++;
      } else if (status.includes('fail')) {
        siteStats.failed++;
      }

      // Track by classification
      if (!siteStats.byClassification.has(classification)) {
        siteStats.byClassification.set(classification, { installed: 0, pending: 0, failed: 0, total: 0 });
      }

      const classStats = siteStats.byClassification.get(classification)!;
      classStats.total++;

      if (status.includes('install') && !status.includes('pending')) {
        classStats.installed++;
      } else if (status.includes('pending')) {
        classStats.pending++;
      } else if (status.includes('fail')) {
        classStats.failed++;
      }
    });

    const result: SiteComplianceEntry[] = [];
    siteMap.forEach((stats, siteName) => {
      const byClassification: { [key: string]: any } = {};
      stats.byClassification.forEach((classStats, classification) => {
        byClassification[classification] = {
          installed: classStats.installed,
          pending: classStats.pending,
          failed: classStats.failed,
          total: classStats.total,
        };
      });

      result.push({
        siteName,
        totalPatches: stats.total,
        installed: stats.installed,
        pending: stats.pending,
        failed: stats.failed,
        complianceRate: this.calculateComplianceRate(stats.installed, stats.total),
        byClassification,
      });
    });

    return result.sort((a, b) => b.complianceRate - a.complianceRate);
  }

  /**
   * Main analytics method
   */
  async analyzePatches(
    request: PatchAnalyticsRequest | undefined,
    ctx: InvocationContext,
  ): Promise<PatchAnalyticsResponse> {
    console.log('=== STARTING PATCH ANALYTICS ===');
    console.log('Filters:', request);

    // Fetch patches from Cosmos DB
    const patches = await this.fetchPatches(request);
    console.log(`Fetched ${patches.length} patches from Cosmos DB`);

    if (patches.length === 0) {
      return {
        summary: {
          totalPatches: 0,
          totalInstalled: 0,
          totalPending: 0,
          totalFailed: 0,
          overallComplianceRate: 0,
          dateRange: { start: '', end: '' },
          uniqueSites: 0,
          uniqueDevices: 0,
        },
        complianceByPatchType: [],
        temporalTrend: [],
        complianceBySite: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Generate all analytics
    const complianceByPatchType = this.generateComplianceByPatchType(patches);
    const temporalTrend = this.generateTemporalTrend(patches);
    const complianceBySite = this.generateComplianceBySite(patches);

    // Calculate summary statistics
    let totalInstalled = 0;
    let totalPending = 0;
    let totalFailed = 0;

    patches.forEach((patch) => {
      const status = patch.Patch_status?.toLowerCase() || '';
      if (status.includes('install') && !status.includes('pending')) {
        totalInstalled++;
      } else if (status.includes('pending')) {
        totalPending++;
      } else if (status.includes('fail')) {
        totalFailed++;
      }
    });

    const allDates = patches
      .map((p) => this.normalizeDate(p.Patch_installation_Date || p.last_updated))
      .sort();

    const uniqueSites = new Set(patches.map((p) => p.Site_name).filter(Boolean)).size;
    const uniqueDevices = new Set(patches.map((p) => p.Device_name).filter(Boolean)).size;

    // If Site_name filter is provided, fetch KB grouping data
    let patchesBySiteAndKB: KBGroupEntry[] | undefined;
    if (request?.Site_name) {
      // Determine date range for KB query
      let startDate = request.startDate;
      let endDate = request.endDate;
      let month = request.month;

      if (request.month && !startDate && !endDate) {
        month = request.month;
      }

      patchesBySiteAndKB = await this.patchRepository.getPatchesBySiteAndKB({
        Site_name: request.Site_name,
        month,
        startDate,
        endDate,
      });

      console.log(`Fetched KB grouping for site ${request.Site_name}: ${patchesBySiteAndKB.length} KB entries`);
    }

    const response: PatchAnalyticsResponse = {
      summary: {
        totalPatches: patches.length,
        totalInstalled,
        totalPending,
        totalFailed,
        overallComplianceRate: this.calculateComplianceRate(totalInstalled, patches.length),
        dateRange: {
          start: allDates.length > 0 ? allDates[0] : '',
          end: allDates.length > 0 ? allDates[allDates.length - 1] : '',
        },
        uniqueSites,
        uniqueDevices,
      },
      complianceByPatchType,
      temporalTrend,
      complianceBySite,
      patchesBySiteAndKB,
      timestamp: new Date().toISOString(),
    };

    console.log('=== PATCH ANALYTICS COMPLETE ===');
    console.log(`Patch types analyzed: ${complianceByPatchType.length}`);
    console.log(`Temporal trend entries: ${temporalTrend.length}`);
    console.log(`Sites analyzed: ${complianceBySite.length}`);
    if (patchesBySiteAndKB) {
      console.log(`KB entries for filtered site: ${patchesBySiteAndKB.length}`);
    }

    ctx.log('Patch analytics completed successfully');

    return response;
  }
}
