import { z } from 'zod';

export const ParseCSVSchema = z.object({
  csvContent: z.string().min(1, 'CSV content is required'),
  delimiter: z.string().optional().default(','),
  includeStats: z.boolean().optional().default(true),
});

export type ParseCSVRequest = z.infer<typeof ParseCSVSchema>;
