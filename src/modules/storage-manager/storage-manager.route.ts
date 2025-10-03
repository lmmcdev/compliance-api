// src/modules/storage-manager/storage-manager.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseQuery,
  withHttp,
} from '../../http';
import {
  CompleteUploadRequestSchema,
  FileUploadFormDataSchema,
  StorageListSchema,
} from './storage-manager.dto';
import { StorageService } from './storage-manager.service';
import { DocAiService, ExtractionRequest } from '../doc-ai';

const path = 'files';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

const listHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { container, prefix, continuationToken, maxResults } = await parseQuery(
      req,
      StorageListSchema,
    );
    const service = new StorageService();
    const { data } = await service.listFiles(container, prefix, ctx);
    return ok(ctx, data);
  },
);

const createUploadHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Parse multipart form data
      const formData = await req.formData();

      // Extract form fields
      const container = 'temp-uploads'; // Fixed container for temp uploads
      const path = 'compliance-api'; // Fixed path for temp uploads
      const metadata = formData.get('metadata');
      const metadataString = metadata === null ? undefined : (metadata as string);
      const file = formData.get('file');

      if (!file || typeof file === 'string') {
        throw new Error('File is required and must be a file');
      }

      // Validate form data
      const dto = FileUploadFormDataSchema.parse({
        container,
        path,
        metadata: metadataString,
      });

      // Extract headers
      const headers = {
        'x-api-key': req.headers.get('x-api-key') || '',
        'x-request-id': req.headers.get('x-request-id') || crypto.randomUUID(),
        'content-type': req.headers.get('content-type') || '',
      };

      // Convert file to buffer and extract filename and content type
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name || 'uploaded-file';
      const contentType = file.type || 'application/octet-stream';

      const service = new StorageService();
      const {
        data: { blobName, id, url, size },
      } = await service.uploadFile(buffer, filename, contentType, dto, headers, ctx);

      // temp uploads are not stored in DB, so just return the response directly
      // call classifyDocument

      const docAiService = new DocAiService();
      const classificationResult = await docAiService.classifyDocument(
        {
          blobName: `${container}/${blobName}`,
        },
        ctx,
      );

      if (!classificationResult) {
        ctx.error('Document classification failed', classificationResult);
        throw new Error('Document classification failed');
      }

      // doc-extraction will pick up the document from temp-uploads container
      const extractionRequest: ExtractionRequest = {
        blobName: `${container}/${blobName}`,
        modelId: classificationResult.results?.[0]?.modelId,
      };

      const extractionResult = await docAiService.extractDocument(extractionRequest, ctx);

      if (!extractionResult) {
        ctx.error('Document extraction failed', extractionResult);
        throw new Error('Document extraction failed');
      }

      console.log('Document classification result:', JSON.stringify(classificationResult, null, 2));
      console.log('Document extraction result:', JSON.stringify(extractionResult, null, 2));

      return created(ctx, extractionResult);
    } catch (error) {
      ctx.error('File upload failed', error);
      throw new Error('File upload failed');
    }
  },
);

/*
const completeUploadHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CompleteUploadRequestSchema);
    const svc = new StorageService();
    const entity = await svc.completeUpload(dto);
    return ok(ctx, entity);
  },
);

const deleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const svc = new StorageService();
    await svc.delete(id);
    return noContent(ctx);
  },
); */

app.http('storage-files-list', {
  route: prefixRoute,
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: listHandler,
});

app.http('storage-files-upload', {
  route: `${prefixRoute}/temp-upload`,
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createUploadHandler,
});
