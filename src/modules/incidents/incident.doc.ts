// Base interface for common fields
interface BaseIncidentDoc {
  id: string;
  incidentNumber: string; // partition key
  doc_type: 'it_incident' | 'compliance_incident';
  row_number?: string;
  createdAt: string;
  updatedAt: string;
  // CosmosDB internal fields
  _rid?: string;
  _self?: string;
  _etag?: string;
  _attachments?: string;
  _ts?: number;
}

// IT Incident document interface
export interface ITIncidentDoc extends BaseIncidentDoc {
  doc_type: 'it_incident';
  Ticket_ID?: string;
  Ticket_impact?: string;
  Ticket_number?: string;
  Activity_status?: string;
  Ticket_priority?: string;
  Ticket_resolved_Date?: string;
  Ticket_resolved_Time?: string;
  Ticket_source?: string;
  Ticket_title?: string;
  Ticket_type?: string;
  Agent_name?: string;
  Public_IP_address?: string;
  Machine_name?: string;
  Machine_ID?: string;
  Comment_contact_ID?: string;
  Comment_end_user_ID?: string;
  Comment_ID?: string;
  Comment_is_internal?: string;
  Comment_source?: string;
  End_User_email?: string;
  End_User_full_name?: string;
  End_User_phone?: string;
  End_User_status?: string;
  Department_ID?: string;
  Site_ID?: string;
  Site_name?: string;
  Site_phone?: string;
  Work_hour_start_Time?: string;
  Work_hour_end_Time?: string;
  Count?: string;
  Count2?: string;
}

// Compliance Incident document interface
export interface ComplianceIncidentDoc extends BaseIncidentDoc {
  doc_type: 'compliance_incident';
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy?: string;
  assignedTo?: string;
  reportedAt: string;
  resolvedAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Union type for all incident documents
export type IncidentDoc = ITIncidentDoc | ComplianceIncidentDoc;