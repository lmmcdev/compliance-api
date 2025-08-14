"use strict";
/* import { HttpRequest, InvocationContext, HttpResponseInit, app } from '@azure/functions';
import { versionedRoute } from '../helpers/versionHelper';
import { LocationService } from '../services/locationService';
const locationService = new LocationService();

const path = 'locations';
const prefixRoute = versionedRoute(path);

async function getLocationById(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    context.log('Processing request to get location by ID');
    const { id } = req.params;
    context.log('Received ID:', id);
    if (!id || typeof id !== 'string' || id.length !== 36) {
      context.log('Invalid or missing Location ID');
      return {
        status: 400,
        jsonBody: { error: 'Location ID is required and must be a valid UUID' },
      };
    }

    const location = await locationService.getById(id);
    if (!location) {
      context.log(`Location not found for ID: ${id}`);
      return {
        status: 404,
        jsonBody: { error: 'Location not found' },
      };
    }

    return {
      status: 200,
      jsonBody: location,
    };
  } catch (error) {
    context.log('Error fetching location:', error);
    return {
      status: 500,
      jsonBody: { error: 'Could not fetch location' },
    };
  }
}

app.http('getLocationById', {
  methods: ['GET'],
  authLevel: 'function',
  route: `${prefixRoute}/{id}`,
  handler: getLocationById,
});
 */
//# sourceMappingURL=location.route.js.map