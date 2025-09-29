import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  withHttp,
  ok,
  created,
  noContent,
  parseJson,
  createPrefixRoute,
  IdParamSchema,
  parseQuery,
} from '../../http';
import { z } from 'zod';

import { IncidentService } from './incident.service';
import { CreateIncidentSchema, UpdateIncidentSchema, ListIncidentsSchema } from './incident.dto';

const { prefixRoute, itemRoute } = createPrefixRoute('incidents');

const IncidentParamSchema = z.object({
  incidentNumber: z.string().min(1),
});

// List
export const incidentsListHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries());
    const query = ListIncidentsSchema.parse(rawQuery);

    const service = await IncidentService.createInstance();
    const page = await service.list(query);
    return ok(ctx, page);
  },
);

// Create
export const incidentsCreateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await parseJson(req, CreateIncidentSchema);
    const dto = CreateIncidentSchema.parse(body);

    const service = await IncidentService.createInstance();
    const entity = await service.create(dto);
    return created(ctx, entity);
  },
);

// Get by ID
export const incidentsGetByIdHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { incidentNumber } = await parseQuery(req, IncidentParamSchema);
    const service = await IncidentService.createInstance();
    const entity = await service.get(id, incidentNumber);
    return ok(ctx, entity);
  },
);

// Update
export const incidentsUpdateHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { incidentNumber } = await parseQuery(req, IncidentParamSchema);
    const { ...patch } = await parseJson(req, UpdateIncidentSchema);

    const service = await IncidentService.createInstance();
    const entity = await service.update(id, incidentNumber, patch);
    return ok(ctx, entity);
  },
);

// Delete
export const incidentsDeleteHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { id } = IdParamSchema.parse((req as any).params ?? {});
    const { incidentNumber } = await parseQuery(req, IncidentParamSchema);
    const service = await IncidentService.createInstance();
    await service.remove(id, incidentNumber);
    return noContent(ctx);
  },
);

// Azure Functions route registrations
app.http('incidents-list', {
  methods: ['GET'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: incidentsListHandler,
});

app.http('incidents-create', {
  methods: ['POST'],
  route: prefixRoute,
  authLevel: 'anonymous',
  handler: incidentsCreateHandler,
});

app.http('incidents-getById', {
  methods: ['GET'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: incidentsGetByIdHandler,
});

app.http('incidents-update', {
  methods: ['PUT', 'PATCH'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: incidentsUpdateHandler,
});

app.http('incidents-delete', {
  methods: ['DELETE'],
  route: itemRoute,
  authLevel: 'anonymous',
  handler: incidentsDeleteHandler,
});