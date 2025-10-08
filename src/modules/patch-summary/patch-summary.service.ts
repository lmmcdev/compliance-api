import { InvocationContext } from '@azure/functions';
import { PatchSummaryRepository } from './patch-summary.repository';
import { PatchSummaryDoc } from './patch-summary.doc';

export class PatchSummaryService {
  private constructor(
    private readonly patchSummaryRepository: PatchSummaryRepository,
  ) {}

  static async createInstance() {
    const patchSummaryRepository = await new PatchSummaryRepository().init();
    return new PatchSummaryService(patchSummaryRepository);
  }

  /**
   * Generate patch summaries for a specific date
   * Summaries are grouped by Site_name and KB_number
   */
  async generateSummariesForDate(date: string, ctx: InvocationContext): Promise<PatchSummaryDoc[]> {
    console.log('=== GENERATING PATCH SUMMARIES ===');
    console.log('Date:', date);

    // Get all sites that have patch data for this date
    const sites = await this.patchSummaryRepository.getSitesForDate(date);

    if (sites.length === 0) {
      console.log('No sites found with patch data for this date');
      ctx.log(`No patch data found for date: ${date}`);
      return [];
    }

    console.log(`Found ${sites.length} sites with patch data`);

    const summaries: PatchSummaryDoc[] = [];

    // Process each site
    for (const site of sites) {
      try {
        // Get aggregated patch data for this site and date (grouped by KB_number)
        const kbAggregatedData = await this.patchSummaryRepository.getPatchDataBySiteAndDate(site, date);

        if (kbAggregatedData.length === 0) {
          console.log(`No patch data for site: ${site}`);
          continue;
        }

        // Create one summary document per KB_number
        for (const kbData of kbAggregatedData) {
          const summary: PatchSummaryDoc = {
            id: `${kbData.KB_number}_${site.toUpperCase().replace(/\s+/g, '_')}_${date}`,
            doc_type: 'windows_patch',
            Patch_name: kbData.Patch_name,
            Patch_status: kbData.Patch_status,
            KB_number: kbData.KB_number,
            Patch_installation_Date: date,
            Device_count: kbData.Device_count,
            Site_name: site,
            Classification: kbData.Classification,
            last_updated: new Date().toISOString(),
          };

          // Upsert summary to Cosmos DB
          const upsertedSummary = await this.patchSummaryRepository.upsertSummary(summary);
          summaries.push(upsertedSummary);
        }

        console.log(`Summaries created for site ${site}:`, {
          uniqueKBs: kbAggregatedData.length,
          totalDevices: kbAggregatedData.reduce((sum, kb) => sum + kb.Device_count, 0),
        });
      } catch (error) {
        console.error(`Error processing site ${site}:`, error);
        ctx.error(`Error processing site ${site}: ${error}`);
      }
    }

    console.log('=== PATCH SUMMARIES COMPLETE ===');
    console.log(`Total summaries created: ${summaries.length}`);
    ctx.log(`Generated ${summaries.length} patch summaries for date ${date}`);

    return summaries;
  }

  /**
   * Generate summaries for yesterday's date (default behavior for timer function)
   */
  async generateSummariesForYesterday(ctx: InvocationContext): Promise<PatchSummaryDoc[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    return this.generateSummariesForDate(date, ctx);
  }
}
