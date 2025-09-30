import { z } from 'zod';

// Enums for ticket fields
export const TicketPriorityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);
export const TicketImpactEnum = z.enum(['Major', 'Minor', 'Moderate', 'Significant']);
export const TicketTypeEnum = z.enum(['Incident', 'Problem', 'Request', 'Change']);

// Create Atera Ticket Schema
export const CreateAteraTicketSchema = z.object({
  TicketTitle: z.string().min(1, 'Ticket title is required').max(500, 'Ticket title too long'),
  Description: z.string().min(1, 'Description is required'),
  TicketPriority: TicketPriorityEnum,
  TicketImpact: TicketImpactEnum,
  TicketType: TicketTypeEnum,
  EndUserFirstName: z.string().min(1, 'End user first name is required'),
  EndUserLastName: z.string().min(1, 'End user last name is required'),
  EndUserEmail: z.string().email('Invalid email format'),
});

export type CreateAteraTicketDto = z.infer<typeof CreateAteraTicketSchema>;

// Response from Logic App (may vary based on actual Logic App response)
export interface AteraTicketResponse {
  success: boolean;
  ticketId?: string;
  ticketNumber?: string;
  message?: string;
  details?: unknown;
}

// Internal response wrapper
export interface CreateAteraTicketResult {
  success: boolean;
  ticket?: {
    ticketId?: string;
    ticketNumber?: string;
    title: string;
    status: string;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}