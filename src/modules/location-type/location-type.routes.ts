// src/modules/location-type/location-type.routes.ts
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
  CreateLocationTypeSchema,
  UpdateLocationTypeSchema,
  ListLocationTypesSchema,
} from './location-type.dto'; // adjust if needed
import { LocationTypeService } from './location-type.service';

const path = 'location-types';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

const listHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const q = parseQuery(req, ListLocationTypesSchema);
    const svc = await LocationTypeService.createInstance();
    const page = await svc.list(q);
    return paginated(ctx, page);
  },
);

const getHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const id = (req as any).params?.id as string;
    const svc = await LocationTypeService.createInstance();
    const entity = await svc.get(id);
    return ok(ctx, entity);
  },
);

const createHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateLocationTypeSchema);
    const svc = await LocationTypeService.createInstance();
    const entity = await svc.create(dto);
    return created(ctx, entity);
  },
);

const updateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const dto = await parseJson(req, UpdateLocationTypeSchema);
    const svc = await LocationTypeService.createInstance();
    const entity = await svc.update(id, dto);
    return ok(ctx, entity);
  },
);

const deleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const svc = await LocationTypeService.createInstance();
    await svc.remove(id);
    return noContent(ctx);
  },
);

// register
app.http('location-types-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: listHandler,
});
app.http('location-types-get', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: getHandler,
});
app.http('location-types-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: createHandler,
});
app.http('location-types-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: updateHandler,
});
app.http('location-types-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: deleteHandler,
});
