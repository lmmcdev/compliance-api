import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  parseJson,
  parseQuery,
  withHttp,
} from '../../http';
import { z } from 'zod';

import { HealthcareProviderService } from './healthcare-provider.service';
import {
  CreateHealthcareProviderSchema,
  UpdateHealthcareProviderSchema,
  ListHealthcareProvidersSchema,
} from './healthcare-provider.dto';

// /api/v1/healthcare-providers
const path = 'healthcare-providers';
const { prefixRoute, itemRoute } = createPrefixRoute(path);

// Require PK on item routes
const PKQuerySchema = z.object({
  accountId: z.uuid(),
});

// ---- Handlers ----
export const providersListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // ?accountId=&q=&status=&npi=&facilityId=&pcp=&attendingPhysician=&inHouse=&pageSize=&token=&sort=&order=
    const q = await parseQuery(req, ListHealthcareProvidersSchema);
    const svc = await HealthcareProviderService.createInstance();
    const page = await svc.list(q);
    return ok(ctx, page);
  },
);

export const providersCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    // Body must include accountId (PK)
    const dto = await parseJson(req, CreateHealthcareProviderSchema);
    const svc = await HealthcareProviderService.createInstance();
    const entity = await svc.create(dto);
    return created(ctx, entity);
  },
);

export const providersGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const svc = await HealthcareProviderService.createInstance();
    const entity = await svc.get(id, accountId);
    return ok(ctx, entity);
  },
);

export const providersUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const patch = await parseJson(req, UpdateHealthcareProviderSchema);
    const svc = await HealthcareProviderService.createInstance();
    const entity = await svc.update(id, accountId, patch);
    return ok(ctx, entity);
  },
);

export const providersDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { accountId } = await parseQuery(req, PKQuerySchema);
    const svc = await HealthcareProviderService.createInstance();
    await svc.remove(id, accountId);
    return noContent(ctx);
  },
);

// ---- Azure Functions registrations ----
app.http('healthcare-providers-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: providersListHandler,
});

app.http('healthcare-providers-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: providersCreateHandler,
});

app.http('healthcare-providers-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: providersGetByIdHandler,
});

app.http('healthcare-providers-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: providersUpdateHandler,
});

app.http('healthcare-providers-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: providersDeleteHandler,
});
