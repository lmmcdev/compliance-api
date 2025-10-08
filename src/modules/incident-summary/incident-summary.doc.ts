// Incident Summary document interface - grouped by Site_name and Product_Family
export interface IncidentSummaryDoc {
  id: string; // Format: "Incident_{SITE_NAME}_{PRODUCT_FAMILY}_{YYYY-MM-DD}"
  doc_type: 'it_incident_summary';
  Ticket_type: string; // "Incident"
  Site_name: string;
  Product_Family: string;
  date: string; // YYYY-MM-DD
  Total_incidents: number;
  Critical_count: number;
  High_count: number;
  Medium_count: number;
  Low_count: number;
  Average_priority_score: number; // 1-4 scale (Critical=4, High=3, Medium=2, Low=1)
  Average_resolution_time_hours: number;
  Closed_count: number;
  Open_count: number;
  last_updated: string; // ISO 8601 timestamp
  // CosmosDB internal fields
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}
