import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { CsvParserService } from '../modules/csv-parser/csv-parser.service';
import { ParseCSVSchema } from '../modules/csv-parser/csv-parser.dto';

/**
 * HTTP-triggered Azure Function to parse CSV content
 * Handles quoted fields with commas correctly
 * Example: "De , mi pa ti. o" is treated as a single field
 */
export async function fnParseCSV(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('=== CSV PARSER FUNCTION ===');

  try {
    // Parse request body
    const bodyText = await request.text();
    let body: any;

    try {
      body = JSON.parse(bodyText);
    } catch {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid JSON body',
        },
      };
    }

    // Validate request
    const validation = ParseCSVSchema.safeParse(body);
    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Validation failed',
          details: validation.error.format(),
        },
      };
    }

    const { csvContent, delimiter, includeStats } = validation.data;

    context.log(`Parsing CSV with delimiter: "${delimiter}"`);

    // Parse CSV
    const result = CsvParserService.formatCSV(csvContent);

    context.log(`Successfully parsed ${result.stats.totalRows} rows with ${result.stats.totalColumns} columns`);

    // Build response
    const response: any = {
      success: true,
      data: result.data,
    };

    if (includeStats) {
      response.stats = result.stats;
    }

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    context.error('Error parsing CSV:', error);

    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Failed to parse CSV',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// Register HTTP function
app.http('fn-parse-csv', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'parse-csv',
  handler: fnParseCSV,
});
