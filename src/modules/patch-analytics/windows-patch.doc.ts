// Windows Patch document interface
export interface WindowsPatchDoc {
  id: string;
  doc_type: 'windows_patch';
  Patch_name: string;
  Patch_status: string; // e.g., "Installed", "Pending", "Failed"
  KB_number: string;
  Patch_installation_Date: string; // YYYY-MM-DD
  Device_name: string;
  Site_name: string;
  Classification: 'Definition Updates' | 'Security Updates' | 'Critical Updates' | 'Feature Updates' | string;
  last_updated: string;
  // CosmosDB internal fields
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}
