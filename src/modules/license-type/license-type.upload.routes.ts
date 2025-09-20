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
    const file = body.get('file');
    const fileName = body.get('fileName');
    const contentType = body.get('contentType') || file?.type || 'application/octet-stream';

    if (!file || !fileName) {
      return {
        status: 400,
        body: 'Missing file or fileName',
      };
    }

    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    const service = new LicenseTypeUploadService();
    const url = await service.uploadFile(fileName, buffer, contentType);
    return created(ctx, { url });
  }
);

app.http('license-types-upload', {
  methods: ['POST'],
  route: path,
  authLevel: 'anonymous',
  handler: licenseTypesUploadHandler,
});
