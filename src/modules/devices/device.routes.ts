import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { createPrefixRoute, ok, fail, withHttp } from '../../http';
import { HTTP_STATUS } from '../../http/status';
import { DeviceService } from './device.service';
import { DeviceListRequestSchema, DeviceCountRequestSchema } from './device.dto';

const devicesPath = 'devices';

const { prefixRoute: devicesRoute } = createPrefixRoute(devicesPath);

let deviceService: DeviceService;

const handleDeviceError = (ctx: InvocationContext, err: any, operation: string) => {
  ctx.error(`Error in ${operation}:`, err);

  // Handle specific error types
  if (err.name === 'TypeError' && err.message.includes('json')) {
    return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'INVALID_JSON', 'Invalid JSON in request body', err.message);
  }

  if (err.name === 'NotFoundError') {
    return fail(ctx, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', err.message);
  }

  if (err.message.includes('Cosmos DB') || err.code === 'COSMOS_ERROR') {
    return fail(ctx, HTTP_STATUS.SERVER_ERROR, 'DATABASE_ERROR', 'Error fetching devices from database', err.message);
  }

  // Generic server error
  return fail(
    ctx,
    HTTP_STATUS.SERVER_ERROR,
    'INTERNAL_ERROR',
    `Internal server error during ${operation}`,
    err.message
  );
};

// GET /api/v1/devices/:id
export const getDeviceHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Initialize service if not already done
      if (!deviceService) {
        deviceService = await DeviceService.createInstance();
      }

      const id = req.params.id;
      if (!id) {
        return fail(ctx, HTTP_STATUS.BAD_REQUEST, 'MISSING_ID', 'Device ID is required');
      }

      const result = await deviceService.get(id);
      return ok(ctx, result);

    } catch (err: any) {
      return handleDeviceError(ctx, err, 'Get Device');
    }
  },
);

// POST /api/v1/devices (list with filters)
export const listDevicesHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Initialize service if not already done
      if (!deviceService) {
        deviceService = await DeviceService.createInstance();
      }

      // Parse body, allow empty body for no filters
      let body: any = {};
      try {
        const text = await req.text();
        if (text && text.trim()) {
          body = JSON.parse(text);
        }
      } catch {
        // Empty body is OK
      }

      console.log('List Devices Request Body:', JSON.stringify(body, null, 2));

      // Validate request body (optional filters)
      const validationResult = DeviceListRequestSchema.safeParse(body);
      console.log('Body validated:', validationResult.success);

      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await deviceService.list(validationResult.data);
      return ok(ctx, result);

    } catch (err: any) {
      return handleDeviceError(ctx, err, 'List Devices');
    }
  },
);

// POST /api/v1/devices/count (get total count with optional filters)
export const countDevicesHandler = withHttp(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Initialize service if not already done
      if (!deviceService) {
        deviceService = await DeviceService.createInstance();
      }

      // Parse body, allow empty body for no filters
      let body: any = {};
      try {
        const text = await req.text();
        if (text && text.trim()) {
          body = JSON.parse(text);
        }
      } catch {
        // Empty body is OK
      }

      console.log('Count Devices Request Body:', JSON.stringify(body, null, 2));

      // Validate request body (optional filters)
      const validationResult = DeviceCountRequestSchema.safeParse(body);
      console.log('Body validated:', validationResult.success);

      if (!validationResult.success) {
        return fail(
          ctx,
          HTTP_STATUS.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request body',
          validationResult.error.issues
        );
      }

      const result = await deviceService.count(validationResult.data);
      return ok(ctx, result);

    } catch (err: any) {
      return handleDeviceError(ctx, err, 'Count Devices');
    }
  },
);

// Register Azure Functions
app.http('getDevice', {
  methods: ['GET'],
  route: `${devicesRoute}/{id}`,
  authLevel: 'anonymous',
  handler: getDeviceHandler,
});

app.http('listDevices', {
  methods: ['POST'],
  route: devicesRoute,
  authLevel: 'anonymous',
  handler: listDevicesHandler,
});

app.http('countDevices', {
  methods: ['POST'],
  route: `${devicesRoute}/count`,
  authLevel: 'anonymous',
  handler: countDevicesHandler,
});
