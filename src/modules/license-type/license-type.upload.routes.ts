// Route for uploading a file to Azure Blob Storage
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { LicenseTypeUploadService } from './license-type.upload.service';
import { UploadLicenseFileSchema } from './license-type.upload.dto';
import { created, withHttp, parseJson } from '../../http';

const path = 'license-types/upload';

const licenseTypesUploadHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Parse form-data or JSON
    const body = await req.formData();
    const fileEntry = body.get('file');
    const fileNameEntry = body.get('fileName');
    const contentTypeEntry = body.get('contentType');

    let fileBuffer: Buffer | undefined;
    let fileName: string | undefined;
    let contentType: string = 'application/octet-stream';

    if (typeof fileNameEntry === 'string') {
      fileName = fileNameEntry;
    }
    if (typeof contentTypeEntry === 'string') {
      contentType = contentTypeEntry;
    }

    if (fileEntry instanceof Buffer) {
      fileBuffer = fileEntry;
    } else if (typeof File !== 'undefined' && fileEntry instanceof File) {
      // @ts-ignore
      fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
      // @ts-ignore
      if (fileEntry.type) contentType = fileEntry.type;
    } else if (typeof fileEntry === 'string') {
      fileBuffer = Buffer.from(fileEntry, 'base64');
    }

    if (!fileBuffer || !fileName) {
      return {
        status: 400,
        body: 'Missing file or fileName',
      };
    }

    const service = new LicenseTypeUploadService();
    const url = await service.uploadFile(fileName, fileBuffer, contentType);
    return created(ctx, { url });
  }
);

app.http('license-types-upload', {
  methods: ['POST'],
  route: path,
  authLevel: 'anonymous',
  handler: licenseTypesUploadHandler,
});
