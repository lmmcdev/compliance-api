import { z } from 'zod';

// Request DTO for listing devices
export const DeviceListRequestSchema = z.object({
  pageSize: z.number().min(1).max(1000).optional(),
  token: z.string().optional(),
  Device_monitored: z.string().optional(), // "true" or "false"
  Inventory_device_type: z.string().optional(),
  Device_name: z.string().optional(),
  q: z.string().optional(), // Search query
}).optional();

export type DeviceListRequest = z.infer<typeof DeviceListRequestSchema>;

// Response DTOs
export interface DeviceResponse {
  id: string;
  doc_type: 'lmmc_device';
  equipmentNumber?: string;
  Device_name: string;
  Device_monitored?: string;
  Device_ID: string;
  Device_last_online_status_received_Date?: string;
  Hostname?: string;
  Inventory_device_type?: string;
  Site_name?: string;
  last_updated: string;
}

export interface DeviceListResponse {
  items: DeviceResponse[];
  continuationToken: string | null;
  meta: {
    count: number;
    hasMore: boolean;
  };
}

export interface DeviceGetResponse {
  data: DeviceResponse;
}

// Request DTO for count
export const DeviceCountRequestSchema = z.object({
  Device_monitored: z.string().optional(), // "true" or "false"
  Inventory_device_type: z.string().optional(),
  Site_name: z.string().optional(), // Filter by specific site
}).optional();

export type DeviceCountRequest = z.infer<typeof DeviceCountRequestSchema>;

export interface SiteCount {
  siteName: string;
  count: number;
}

export interface EquipmentInfo {
  Device_name: string;
  Hostname?: string;
}

export interface DeviceCountResponse {
  total: number;
  bySite: SiteCount[];
  equipment?: EquipmentInfo[];
  filters?: {
    Device_monitored?: string;
    Inventory_device_type?: string;
    Site_name?: string;
  };
}
