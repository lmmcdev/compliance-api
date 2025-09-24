import { z } from 'zod';

// Base storage blob metadata schema
export const BlobMetadataSchema = z.record(z.string(), z.string()).optional();

// Storage blob response schema
export const StorageBlobSchema = z.object({
  id: z.string().min(1, 'Blob ID is required'),
  container: z.string().min(1, 'Container name is required'),
  blobName: z.string().min(1, 'Blob name is required'),
  url: z.url('Must be a valid URL'),
  etag: z.string().min(1, 'ETag is required'),
  size: z.number().int().min(0, 'Size must be a non-negative integer'),
  contentType: z.string().min(1, 'Content type is required'),
  metadata: BlobMetadataSchema,
});

// TypeScript types
export type BlobMetadata = z.infer<typeof BlobMetadataSchema>;
export type StorageBlob = z.infer<typeof StorageBlobSchema>;

// Upload request schema
export const BlobUploadRequestSchema = z.object({
  container: z.string().min(1, 'Container name is required'),
  blobName: z.string().min(1, 'Blob name is required'),
  contentType: z.string().optional(),
  metadata: BlobMetadataSchema,
});

export type BlobUploadRequest = z.infer<typeof BlobUploadRequestSchema>;

// File upload form data schema (for multipart/form-data requests)
export const FileUploadFormDataSchema = z.object({
  container: z.string().min(1, 'Container name is required'),
  path: z.string().optional(),
  metadata: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Metadata must be valid JSON string' },
    ),
});

export type FileUploadFormData = z.infer<typeof FileUploadFormDataSchema>;

// Parsed metadata from form data
export const ParsedMetadataSchema = z.record(z.string(), z.string()).optional();
export type ParsedMetadata = z.infer<typeof ParsedMetadataSchema>;

// Upload request headers schema
export const UploadRequestHeadersSchema = z.object({
  'x-api-key': z.string().min(1, 'API key is required'),
  'x-request-id': z.string().uuid('Request ID must be a valid UUID'),
  'content-type': z.string().optional(),
});

export type UploadRequestHeaders = z.infer<typeof UploadRequestHeadersSchema>;

// Complete upload request (form data + headers + file)
export const CompleteUploadRequestSchema = z.object({
  formData: FileUploadFormDataSchema,
  headers: UploadRequestHeadersSchema,
  file: z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().int().min(1, 'File size must be greater than 0'),
    type: z.string().optional(),
    buffer: z.any(), // File buffer/stream
  }),
});

export type CompleteUploadRequest = z.infer<typeof CompleteUploadRequestSchema>;

// Storage-manager-api single blob response
export const StorageManagerResponseSchema = z.object({
  data: StorageBlobSchema,
  requestId: z.string().uuid('Request ID must be a valid UUID'),
});

export type StorageManagerResponse = z.infer<typeof StorageManagerResponseSchema>;

// Storage response with multiple blobs (for list operations)
export const StorageListResponseSchema = z.object({
  data: z.object({
    blobs: z.array(StorageBlobSchema),
    totalCount: z.number().int().min(0),
    continuationToken: z.string().optional(),
  }),
  requestId: z.string().uuid('Request ID must be a valid UUID'),
});

export type StorageListResponse = z.infer<typeof StorageListResponseSchema>;

// Storage error response
export const StorageErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  requestId: z.string().uuid('Request ID must be a valid UUID').optional(),
});

export type StorageError = z.infer<typeof StorageErrorSchema>;
