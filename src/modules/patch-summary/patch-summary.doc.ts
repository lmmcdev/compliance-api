// Patch Summary document interface - grouped by Site_name and KB_number
export interface PatchSummaryDoc {
  id: string; // Format: "{KB_number}_{SITE_NAME}"
  doc_type: 'windows_patch';
  Patch_name: string;
  Patch_status: string; // Most common status for this KB at this site
  KB_number: string;
  Patch_installation_Date: string; // YYYY-MM-DD
  Device_count: number; // Count of unique devices with this KB at this site
  Site_name: string;
  Classification: string;
  last_updated: string; // ISO 8601 timestamp
  // CosmosDB internal fields
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}
