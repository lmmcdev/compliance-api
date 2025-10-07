import { z } from 'zod';

// Request DTO - optional filters for fetching patches from Cosmos DB
export const PatchAnalyticsRequestSchema = z.object({
  month: z.string().optional(), // YYYY-MM format (e.g., "2025-10")
  Classification: z.string().optional(),
  Patch_status: z.string().optional(),
  Site_name: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM-DD (overrides month if provided)
  endDate: z.string().optional(),   // YYYY-MM-DD (overrides month if provided)
}).optional();

export type PatchAnalyticsRequest = z.infer<typeof PatchAnalyticsRequestSchema>;

// Response DTOs
export interface PatchTypeCompliance {
  patchType: string; // "Feature Updates", "Security Updates", "Definition Updates", etc.
  totalPatches: number;
  installed: number;
  pending: number;
  failed: number;
  complianceRate: number; // percentage (0-100)
}

export interface TemporalTrendEntry {
  date: string; // YYYY-MM-DD
  installed: number;
  pending: number;
  failed: number;
  total: number;
  byClassification: {
    [classification: string]: {
      installed: number;
      pending: number;
      failed: number;
      total: number;
    };
  };
}

export interface SiteComplianceEntry {
  siteName: string;
  totalPatches: number;
  installed: number;
  pending: number;
  failed: number;
  complianceRate: number; // percentage (0-100)
  byClassification: {
    [classification: string]: {
      installed: number;
      pending: number;
      failed: number;
      total: number;
    };
  };
}

export interface KBDeviceInfo {
  Device_name: string;
  Patch_status: string;
}

export interface KBGroupEntry {
  KB_number: string;
  devices: KBDeviceInfo[];
}

export interface PatchAnalyticsResponse {
  summary: {
    totalPatches: number;
    totalInstalled: number;
    totalPending: number;
    totalFailed: number;
    overallComplianceRate: number; // percentage (0-100)
    dateRange: {
      start: string;
      end: string;
    };
    uniqueSites: number;
    uniqueDevices: number;
  };
  complianceByPatchType: PatchTypeCompliance[];
  temporalTrend: TemporalTrendEntry[];
  complianceBySite: SiteComplianceEntry[];
  patchesBySiteAndKB?: KBGroupEntry[]; // Only included when Site_name filter is provided
  timestamp: string;
}
