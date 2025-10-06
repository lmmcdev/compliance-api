import { InvocationContext } from '@azure/functions';
import {
  IncidentAnalyticsRequest,
  IncidentAnalyticsResponse,
  TimelineEntry,
  HeatmapEntry,
  BlockedToolEntry,
  GeographicEntry,
} from './incident-analytics.dto';
import { IncidentRepository } from '../incidents/incident.repository';
import { IncidentDoc } from '../incidents/incident.doc';

export class IncidentAnalyticsService {
  private constructor(
    private readonly incidentRepository: IncidentRepository,
  ) {}

  static async createInstance() {
    const incidentRepository = await new IncidentRepository().init();
    return new IncidentAnalyticsService(incidentRepository);
  }
  /**
   * Normalize datetime to ISO 8601 format and extract hour (0-23)
   */
  private normalizeDateTime(dateString: string): { isoDate: string; hour: number; dateOnly: string } | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return {
        isoDate: date.toISOString(),
        hour: date.getUTCHours(), // 0-23 format
        dateOnly: date.toISOString().split('T')[0], // YYYY-MM-DD
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract category/product family from incident
   */
  private extractCategory(incident: any): string {
    return incident.Product_Family || incident.doc_type || incident.Ticket_type || 'Uncategorized';
  }

  /**
   * Extract blocked tools/apps from incident title
   */
  private extractBlockedTools(incident: any): string[] {
    const title = incident.Ticket_title || '';
    const tools: string[] = [];

    // Look for patterns in brackets or common tool names
    const bracketMatches = title.match(/\[([^\]]+)\]/g);
    if (bracketMatches) {
      bracketMatches.forEach((match: string) => {
        const tool = match.replace(/[\[\]]/g, '').trim();
        if (tool && !tool.toLowerCase().includes('managed') && !tool.toLowerCase().includes('rule')) {
          tools.push(tool);
        }
      });
    }

    return tools;
  }

  /**
   * Generate timeline of incidents by category
   */
  private generateTimeline(incidents: any[]): TimelineEntry[] {
    const timelineMap = new Map<string, Map<string, any[]>>();

    incidents.forEach((incident) => {
      const created = this.normalizeDateTime(incident.Ticket_created_Time);
      if (!created) return;

      const category = this.extractCategory(incident);
      const dateKey = created.dateOnly;

      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, new Map());
      }

      const dayMap = timelineMap.get(dateKey)!;
      if (!dayMap.has(category)) {
        dayMap.set(category, []);
      }

      dayMap.get(category)!.push({
        id: incident.id || incident.Ticket_ID,
        title: incident.Ticket_title,
        created: created.isoDate,
        resolved: incident.Ticket_resolved_Time ? this.normalizeDateTime(incident.Ticket_resolved_Time)?.isoDate : undefined,
      });
    });

    const timeline: TimelineEntry[] = [];
    timelineMap.forEach((categoryMap, date) => {
      categoryMap.forEach((incidentList, category) => {
        timeline.push({
          date,
          category,
          count: incidentList.length,
          incidents: incidentList,
        });
      });
    });

    return timeline.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate heatmap by activity status and hour
   */
  private generateHeatmap(incidents: any[]): HeatmapEntry[] {
    const heatmapMap = new Map<string, Map<number, string[]>>();

    incidents.forEach((incident) => {
      const created = this.normalizeDateTime(incident.Ticket_created_Time);
      if (!created) return;

      const activity = incident.Activity_status || 'Unknown';
      const hour = created.hour;

      if (!heatmapMap.has(activity)) {
        heatmapMap.set(activity, new Map());
      }

      const activityMap = heatmapMap.get(activity)!;
      if (!activityMap.has(hour)) {
        activityMap.set(hour, []);
      }

      activityMap.get(hour)!.push(incident.id || incident.Ticket_ID);
    });

    const heatmap: HeatmapEntry[] = [];
    heatmapMap.forEach((hourMap, activity) => {
      hourMap.forEach((incidentIds, hour) => {
        heatmap.push({
          hour,
          activity,
          count: incidentIds.length,
          incidents: incidentIds,
        });
      });
    });

    return heatmap.sort((a, b) => {
      if (a.activity !== b.activity) return a.activity.localeCompare(b.activity);
      return a.hour - b.hour;
    });
  }

  /**
   * Analyze blocked tools/apps
   */
  private analyzeBlockedTools(incidents: any[]): BlockedToolEntry[] {
    const toolsMap = new Map<string, { incidents: string[]; timestamps: Date[] }>();

    incidents.forEach((incident) => {
      const tools = this.extractBlockedTools(incident);
      const created = this.normalizeDateTime(incident.Ticket_created_Time);
      if (!created) return;

      tools.forEach((tool) => {
        if (!toolsMap.has(tool)) {
          toolsMap.set(tool, { incidents: [], timestamps: [] });
        }
        const entry = toolsMap.get(tool)!;
        entry.incidents.push(incident.id || incident.Ticket_ID);
        entry.timestamps.push(new Date(created.isoDate));
      });
    });

    const blockedTools: BlockedToolEntry[] = [];
    toolsMap.forEach((data, tool) => {
      const sortedTimestamps = data.timestamps.sort((a, b) => a.getTime() - b.getTime());
      blockedTools.push({
        tool,
        count: data.incidents.length,
        incidents: data.incidents,
        firstOccurrence: sortedTimestamps[0].toISOString(),
        lastOccurrence: sortedTimestamps[sortedTimestamps.length - 1].toISOString(),
      });
    });

    return blockedTools.sort((a, b) => b.count - a.count);
  }

  /**
   * Generate geographic map from IP addresses
   * Note: This creates entries but doesn't do actual geolocation (would need external service)
   */
  private generateGeographicMap(incidents: any[]): GeographicEntry[] {
    const ipMap = new Map<string, string[]>();

    incidents.forEach((incident) => {
      const ip = incident.Public_IP_address;
      if (!ip) return;

      if (!ipMap.has(ip)) {
        ipMap.set(ip, []);
      }
      ipMap.get(ip)!.push(incident.id || incident.Ticket_ID);
    });

    const geographicMap: GeographicEntry[] = [];
    ipMap.forEach((incidentIds, ip) => {
      geographicMap.push({
        ip,
        count: incidentIds.length,
        incidents: incidentIds,
        // Note: latitude, longitude, city, country would require IP geolocation service
      });
    });

    return geographicMap.sort((a, b) => b.count - a.count);
  }

  /**
   * Fetch incidents from Cosmos DB with optional filters
   */
  private async fetchIncidents(filters?: IncidentAnalyticsRequest): Promise<IncidentDoc[]> {
    const allIncidents: IncidentDoc[] = [];
    let continuationToken: string | null = null;

    // Fetch all pages
    do {
      const result = await this.incidentRepository.list({
        pageSize: 100,
        token: continuationToken || undefined,
        doc_type: filters?.doc_type,
        Ticket_priority: filters?.Ticket_priority,
        Activity_status: filters?.Activity_status,
        Ticket_type: filters?.Ticket_type,
        severity: filters?.severity,
        status: filters?.status,
      });

      allIncidents.push(...result.items);
      continuationToken = result.continuationToken;
    } while (continuationToken);

    // Filter by date range if provided
    if (filters?.startDate || filters?.endDate) {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      return allIncidents.filter((incident) => {
        const createdDate = new Date(incident.createdAt);
        if (startDate && createdDate < startDate) return false;
        if (endDate && createdDate > endDate) return false;
        return true;
      });
    }

    return allIncidents;
  }

  /**
   * Get creation time from incident (handles both IT and compliance incidents)
   */
  private getCreationTime(incident: IncidentDoc): string | undefined {
    if (incident.doc_type === 'it_incident') {
      return (incident as any).Ticket_created_Time || incident.createdAt;
    }
    return incident.createdAt;
  }

  /**
   * Get resolution time from incident (handles both IT and compliance incidents)
   */
  private getResolutionTime(incident: IncidentDoc): string | undefined {
    if (incident.doc_type === 'it_incident') {
      return (incident as any).Ticket_resolved_Time;
    }
    if (incident.doc_type === 'compliance_incident') {
      return incident.resolvedAt;
    }
    return undefined;
  }

  /**
   * Main analytics method
   */
  async analyzeIncidents(
    request: IncidentAnalyticsRequest | undefined,
    ctx: InvocationContext,
  ): Promise<IncidentAnalyticsResponse> {
    console.log('=== STARTING INCIDENT ANALYTICS ===');
    console.log('Filters:', request);

    // Fetch incidents from Cosmos DB
    const incidents = await this.fetchIncidents(request);
    console.log(`Fetched ${incidents.length} incidents from Cosmos DB`);

    if (incidents.length === 0) {
      return {
        summary: {
          totalIncidents: 0,
          dateRange: { start: '', end: '' },
          uniqueCategories: 0,
          uniqueIPs: 0,
        },
        timeline: [],
        heatmap: [],
        blockedTools: [],
        geographicMap: [],
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize incidents data for analytics
    const normalizedIncidents = incidents.map((inc) => ({
      ...inc,
      Ticket_created_Time: this.getCreationTime(inc),
      Ticket_resolved_Time: this.getResolutionTime(inc),
      Ticket_title: inc.doc_type === 'it_incident' ? (inc as any).Ticket_title : (inc as any).title,
      Activity_status: inc.doc_type === 'it_incident' ? (inc as any).Activity_status : (inc as any).status,
      Public_IP_address: inc.doc_type === 'it_incident' ? (inc as any).Public_IP_address : undefined,
    }));

    // Generate all analytics
    const timeline = this.generateTimeline(normalizedIncidents);
    const heatmap = this.generateHeatmap(normalizedIncidents);
    const blockedTools = this.analyzeBlockedTools(normalizedIncidents);
    const geographicMap = this.generateGeographicMap(normalizedIncidents);

    // Calculate summary
    const allDates = normalizedIncidents
      .map((inc: any) => this.normalizeDateTime(inc.Ticket_created_Time))
      .filter((d: any) => d !== null)
      .map((d: any) => new Date(d!.isoDate));

    const sortedDates = allDates.sort((a: any, b: any) => a.getTime() - b.getTime());
    const uniqueCategories = new Set(normalizedIncidents.map((inc: any) => this.extractCategory(inc))).size;
    const uniqueIPs = new Set(normalizedIncidents.map((inc: any) => inc.Public_IP_address).filter(Boolean)).size;

    const response: IncidentAnalyticsResponse = {
      summary: {
        totalIncidents: incidents.length,
        dateRange: {
          start: sortedDates.length > 0 ? sortedDates[0].toISOString() : '',
          end: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].toISOString() : '',
        },
        uniqueCategories,
        uniqueIPs,
      },
      timeline,
      heatmap,
      blockedTools,
      geographicMap,
      timestamp: new Date().toISOString(),
    };

    console.log('=== ANALYTICS COMPLETE ===');
    console.log(`Timeline entries: ${timeline.length}`);
    console.log(`Heatmap entries: ${heatmap.length}`);
    console.log(`Blocked tools: ${blockedTools.length}`);
    console.log(`Geographic entries: ${geographicMap.length}`);

    ctx.log('Analytics completed successfully');

    return response;
  }
}
