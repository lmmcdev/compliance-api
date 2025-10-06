import { z } from 'zod';

// Request DTO - optional filters for fetching incidents from Cosmos DB
export const IncidentAnalyticsRequestSchema = z.object({
  doc_type: z.enum(['it_incident', 'compliance_incident']).optional(),
  Ticket_priority: z.string().optional(),
  Activity_status: z.string().optional(),
  Ticket_type: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(),   // ISO date string
}).optional();

export type IncidentAnalyticsRequest = z.infer<typeof IncidentAnalyticsRequestSchema>;

// Response DTOs
export interface TimelineEntry {
  date: string; // YYYY-MM-DD
  category: string;
  count: number;
  incidents: Array<{
    id: string;
    title: string;
    created: string;
    resolved?: string;
  }>;
}

export interface HeatmapEntry {
  hour: number; // 0-23
  activity: string;
  count: number;
  incidents: string[]; // incident IDs
}

export interface BlockedToolEntry {
  tool: string;
  count: number;
  incidents: string[]; // incident IDs
  firstOccurrence: string;
  lastOccurrence: string;
}

export interface GeographicEntry {
  ip: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  count: number;
  incidents: string[]; // incident IDs
}

export interface IncidentAnalyticsResponse {
  summary: {
    totalIncidents: number;
    dateRange: {
      start: string;
      end: string;
    };
    uniqueCategories: number;
    uniqueIPs: number;
  };
  timeline: TimelineEntry[];
  heatmap: HeatmapEntry[];
  blockedTools: BlockedToolEntry[];
  geographicMap: GeographicEntry[];
  timestamp: string;
}
