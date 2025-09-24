// src/modules/storage-manager/storage-manager.route.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseJson,
  parseQuery,
  withHttp,
} from '../../http';
import {
  CompleteUploadRequestSchema,
  FileUploadFormDataSchema,
  StorageListSchema,
} from './storage-manager.dto';
import { StorageService } from './storage-manager.service';

const path = 'storage-manager';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

const listHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { container, prefix, continuationToken, maxResults } = await parseQuery(
      req,
      StorageListSchema,
    );
    const service = new StorageService();
    const response = await service.listFiles(container, prefix, ctx);
    return ok(ctx, response);
  },
);

/* const createUploadHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, FileUploadFormDataSchema);
    const service = new StorageService();
    const entity = await service.uploadFile(dto);
    return created(ctx, entity);
  },
);

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

/* app.http('getStorageItem', {
  route: itemRoute,
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getHandler,
});

app.http('createStorageUpload', {
  route: `${prefixRoute}/upload`,
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: createUploadHandler,
});

app.http('completeStorageUpload', {
  route: `${prefixRoute}/upload/complete`,
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: completeUploadHandler,
});

app.http('deleteStorageItem', {
  route: itemRoute,
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: deleteHandler,
}); */
