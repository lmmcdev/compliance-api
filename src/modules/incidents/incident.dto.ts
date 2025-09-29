import { z } from 'zod';

// Base schema for common fields
const BaseIncidentSchema = z.object({
  incidentNumber: z.string().min(1, 'Incident number is required'),
  doc_type: z.enum(['it_incident', 'compliance_incident']),
  row_number: z.string().optional(),
});

// IT Incident specific schema
const ITIncidentSchema = BaseIncidentSchema.extend({
  doc_type: z.literal('it_incident'),
  Ticket_ID: z.string().optional(),
  Ticket_impact: z.string().optional(),
  Ticket_number: z.string().optional(),
  Activity_status: z.string().optional(),
  Ticket_priority: z.string().optional(),
  Ticket_resolved_Date: z.string().optional(),
  Ticket_resolved_Time: z.string().optional(),
  Ticket_source: z.string().optional(),
  Ticket_title: z.string().optional(),
  Ticket_type: z.string().optional(),
  Agent_name: z.string().optional(),
  Public_IP_address: z.string().optional(),
  Machine_name: z.string().optional(),
  Machine_ID: z.string().optional(),
  Comment_contact_ID: z.string().optional(),
  Comment_end_user_ID: z.string().optional(),
  Comment_ID: z.string().optional(),
  Comment_is_internal: z.string().optional(),
  Comment_source: z.string().optional(),
  End_User_email: z.string().optional(),
  End_User_full_name: z.string().optional(),
  End_User_phone: z.string().optional(),
  End_User_status: z.string().optional(),
  Department_ID: z.string().optional(),
  Site_ID: z.string().optional(),
  Site_name: z.string().optional(),
  Site_phone: z.string().optional(),
  Work_hour_start_Time: z.string().optional(),
  Work_hour_end_Time: z.string().optional(),
  Count: z.string().optional(),
  Count2: z.string().optional(),
});

// Compliance Incident specific schema (placeholder for now)
const ComplianceIncidentSchema = BaseIncidentSchema.extend({
  doc_type: z.literal('compliance_incident'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).default('open'),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  reportedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Discriminated union for creating incidents
export const CreateIncidentSchema = z.discriminatedUnion('doc_type', [
  ITIncidentSchema,
  ComplianceIncidentSchema,
]);

// Update schemas - partial versions
export const UpdateITIncidentSchema = ITIncidentSchema.partial().omit({
  incidentNumber: true,
});

export const UpdateComplianceIncidentSchema = ComplianceIncidentSchema.partial().omit({
  incidentNumber: true,
});

export const UpdateIncidentSchema = z.discriminatedUnion('doc_type', [
  UpdateITIncidentSchema,
  UpdateComplianceIncidentSchema,
]);

// List/query schema
export const ListIncidentsSchema = z.object({
  pageSize: z.coerce.number().min(1).max(100).optional(),
  token: z.string().optional(),
  q: z.string().optional(),
  doc_type: z.enum(['it_incident', 'compliance_incident']).optional(),
  // IT incident specific filters
  Ticket_priority: z.string().optional(),
  Activity_status: z.string().optional(),
  Ticket_type: z.string().optional(),
  // Compliance incident specific filters
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().optional(),
  // Sorting options
  sort: z.enum(['createdAt', 'updatedAt', 'Ticket_resolved_Date', 'reportedAt']).optional(),
  order: z.enum(['ASC', 'DESC']).optional(),
});

export type CreateIncident = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncident = z.infer<typeof UpdateIncidentSchema>;
export type ListIncidents = z.infer<typeof ListIncidentsSchema>;
export type ITIncident = z.infer<typeof ITIncidentSchema>;
export type ComplianceIncident = z.infer<typeof ComplianceIncidentSchema>;