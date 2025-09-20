// Service for uploading files to Azure Blob Storage
import { BlobServiceClient } from '@azure/storage-blob';
import env from '../../config/env';

const containerName = 'compliance/licenses';

export class LicenseTypeUploadService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    const connectionString = process.env.AZURE_BLOB_CONNECTION_STRING || env.AZURE_BLOB_CONNECTION_STRING;
    if (!connectionString) throw new Error('Azure Blob Storage connection string not set');
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
    return blockBlobClient.url;
  }
}
