import { InvocationContext } from '@azure/functions';
import { IncidentSummaryRepository } from './incident-summary.repository';
import { IncidentSummaryDoc } from './incident-summary.doc';

export class IncidentSummaryService {
  private constructor(
    private readonly incidentSummaryRepository: IncidentSummaryRepository,
  ) {}

  static async createInstance() {
    const incidentSummaryRepository = await new IncidentSummaryRepository().init();
    return new IncidentSummaryService(incidentSummaryRepository);
  }

  /**
   * Calculate priority score (Critical=4, High=3, Medium=2, Low=1, No Impact=0)
   */
  private getPriorityScore(priority: string): number {
    const priorityLower = priority?.toLowerCase() || '';
    if (priorityLower.includes('critical')) return 4;
    if (priorityLower.includes('high')) return 3;
    if (priorityLower.includes('medium')) return 2;
    if (priorityLower.includes('low')) return 1;
    return 0; // No Impact or unknown
  }

  /**
   * Calculate resolution time in hours
   */
  private calculateResolutionTime(createdTime: string, resolvedTime?: string): number | null {
    if (!resolvedTime) return null;

    try {
      const created = new Date(createdTime);
      const resolved = new Date(resolvedTime);

      if (isNaN(created.getTime()) || isNaN(resolved.getTime())) {
        return null;
      }

      const diffMs = resolved.getTime() - created.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      return Math.max(0, diffHours); // Ensure non-negative
    } catch {
      return null;
    }
  }

  /**
   * Generate incident summaries for a specific date
   * Summaries are grouped by Site_name and Product_Family
   */
  async generateSummariesForDate(date: string, ctx: InvocationContext): Promise<IncidentSummaryDoc[]> {
    console.log('=== GENERATING INCIDENT SUMMARIES ===');
    console.log('Date:', date);

    // Get all site-product combinations that have incident data for this date
    const combinations = await this.incidentSummaryRepository.getSiteProductCombinationsForDate(date);

    if (combinations.length === 0) {
      console.log('No site-product combinations found with incident data for this date');
      ctx.log(`No incident data found for date: ${date}`);
      return [];
    }

    console.log(`Found ${combinations.length} site-product combinations with incident data`);

    const summaries: IncidentSummaryDoc[] = [];

    // Process each site-product combination
    for (const { site, productFamily } of combinations) {
      try {
        // Get incident data for this site, product family, and date
        const incidents = await this.incidentSummaryRepository.getIncidentsBySiteProductAndDate(site, productFamily, date);

        if (incidents.length === 0) {
          console.log(`No incidents for site: ${site}`);
          continue;
        }

        // Calculate statistics
        let criticalCount = 0;
        let highCount = 0;
        let mediumCount = 0;
        let lowCount = 0;
        let closedCount = 0;
        let openCount = 0;
        let totalPriorityScore = 0;
        const resolutionTimes: number[] = [];

        incidents.forEach((incident) => {
          const priority = incident.Ticket_priority?.toLowerCase() || '';
          const status = incident.Activity_status?.toLowerCase() || '';

          // Count by priority
          if (priority.includes('critical')) criticalCount++;
          else if (priority.includes('high')) highCount++;
          else if (priority.includes('medium')) mediumCount++;
          else if (priority.includes('low')) lowCount++;

          // Count by status
          if (status.includes('closed') || status.includes('resolved')) {
            closedCount++;
          } else {
            openCount++;
          }

          // Calculate priority score
          totalPriorityScore += this.getPriorityScore(incident.Ticket_priority);

          // Calculate resolution time
          const resolutionTime = this.calculateResolutionTime(
            incident.Ticket_created_Time,
            incident.Ticket_resolved_Time
          );
          if (resolutionTime !== null) {
            resolutionTimes.push(resolutionTime);
          }
        });

        const totalIncidents = incidents.length;
        const averagePriorityScore = totalIncidents > 0
          ? Math.round((totalPriorityScore / totalIncidents) * 100) / 100
          : 0;

        const averageResolutionTimeHours = resolutionTimes.length > 0
          ? Math.round((resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length) * 100) / 100
          : 0;

        // Create summary document
        const productFamilySafe = productFamily.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const summary: IncidentSummaryDoc = {
          id: `Incident_${site.toUpperCase().replace(/\s+/g, '_')}_${productFamilySafe}_${date}`,
          doc_type: 'it_incident_summary',
          Ticket_type: 'Incident',
          Site_name: site,
          Product_Family: productFamily,
          date,
          Total_incidents: totalIncidents,
          Critical_count: criticalCount,
          High_count: highCount,
          Medium_count: mediumCount,
          Low_count: lowCount,
          Average_priority_score: averagePriorityScore,
          Average_resolution_time_hours: averageResolutionTimeHours,
          Closed_count: closedCount,
          Open_count: openCount,
          last_updated: new Date().toISOString(),
        };

        // Upsert summary to Cosmos DB
        const upsertedSummary = await this.incidentSummaryRepository.upsertSummary(summary);
        summaries.push(upsertedSummary);

        console.log(`Summary created for site ${site}, product ${productFamily}:`, {
          Total_incidents: totalIncidents,
          Critical_count: criticalCount,
          Average_priority_score: averagePriorityScore,
        });
      } catch (error) {
        console.error(`Error processing site ${site}, product ${productFamily}:`, error);
        ctx.error(`Error processing site ${site}, product ${productFamily}: ${error}`);
      }
    }

    console.log('=== INCIDENT SUMMARIES COMPLETE ===');
    console.log(`Total summaries created: ${summaries.length}`);
    ctx.log(`Generated ${summaries.length} incident summaries for date ${date}`);

    return summaries;
  }

  /**
   * Generate summaries for yesterday's date (default behavior for timer function)
   */
  async generateSummariesForYesterday(ctx: InvocationContext): Promise<IncidentSummaryDoc[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    return this.generateSummariesForDate(date, ctx);
  }
}
