// DTO for file upload to Azure Blob Storage
import { z } from 'zod';

export const UploadLicenseFileSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  file: z.any(), // This will be handled as a Buffer or stream in the handler
});

export type UploadLicenseFileDto = z.infer<typeof UploadLicenseFileSchema>;
