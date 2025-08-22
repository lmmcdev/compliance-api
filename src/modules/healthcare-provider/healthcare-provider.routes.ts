// src/modules/healthcare-provider/healthcare-provider.routes.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  created,
  createPrefixRoute,
  IdParamSchema,
  noContent,
  ok,
  paginated,
  parseJson,
  parseParams,
  parseQuery,
  withHttp,
} from '../../http';

import {
  CreateHealthcareProviderSchema,
  UpdateHealthcareProviderSchema,
  ListHealthcareProvidersSchema,
} from './healthcare-provider.dto';
import { getDataSource } from '../../infrastructure/ds-runtime';
import { HealthcareProviderService } from './healthcare-provider.service';

const { prefixRoute, itemRoute } = createPrefixRoute('healthcare-providers');

// -------- Handlers --------

export const healthcareProvidersListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const query = await parseQuery(req, ListHealthcareProvidersSchema);
    const ds = await getDataSource();
    const service = new HealthcareProviderService(ds);
    const page = await service.list(query);
    return paginated(ctx, page);
  },
);

export const healthcareProvidersCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const dto = await parseJson(req, CreateHealthcareProviderSchema);
    const ds = await getDataSource();
    const service = new HealthcareProviderService(ds);
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

export const healthcareProvidersGetHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new HealthcareProviderService(ds);
    const entity = await service.get(id);
    return ok(ctx, entity);
  },
);

export const healthcareProvidersUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const dto = await parseJson(req, UpdateHealthcareProviderSchema);
    const ds = await getDataSource();
    const service = new HealthcareProviderService(ds);
    const entity = await service.update(id, dto);
    return ok(ctx, entity);
  },
);

export const healthcareProvidersDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = parseParams(req, IdParamSchema);
    const ds = await getDataSource();
    const service = new HealthcareProviderService(ds);
    await service.remove(id);
    return noContent(ctx);
  },
);

// -------- Routes --------

app.http('healthcare-providers-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthcareProvidersListHandler,
});

app.http('healthcare-providers-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: healthcareProvidersCreateHandler,
});

app.http('healthcare-providers-get', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareProvidersGetHandler,
});

app.http('healthcare-providers-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareProvidersUpdateHandler,
});

app.http('healthcare-providers-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: healthcareProvidersDeleteHandler,
});
