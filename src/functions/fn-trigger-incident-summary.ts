import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { IncidentSummaryService } from '../modules/incident-summary/incident-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';
import { env } from '../config/env';

/**
 * HTTP-triggered Azure Function to manually trigger incident summary generation
 * This is useful for testing and manual runs
 */
export async function fnTriggerIncidentSummary(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('=== MANUAL INCIDENT SUMMARY TRIGGER ===');
  context.log('Execution time:', new Date().toISOString());

  try {
    // Get date from query parameter or use yesterday as default
    const dateParam = request.query.get('date');
    let targetDate: string;

    if (dateParam) {
      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return {
          status: 400,
          jsonBody: {
            error: 'Invalid date format. Use YYYY-MM-DD format.',
            example: '2025-09-30',
          },
        };
      }
      targetDate = dateParam;
      context.log(`Using provided date: ${targetDate}`);
    } else {
      // Default to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday.toISOString().split('T')[0];
      context.log(`Using yesterday's date: ${targetDate}`);
    }

    // Create service instance
    const incidentSummaryService = await IncidentSummaryService.createInstance();

    // Generate summaries for the target date
    const summaries = await incidentSummaryService.generateSummariesForDate(targetDate, context);

    context.log(`Successfully generated ${summaries.length} incident summaries`);

    // Index summaries to Cognitive Search if configured
    if (summaries.length > 0 && env.COGNITIVE_SEARCH_INCIDENTS_INDEX_NAME) {
      context.log('Indexing summaries to Cognitive Search...');

      const cognitiveSearchService = new CognitiveSearchService(
        env.COGNITIVE_SEARCH_INCIDENTS_INDEX_NAME
      );

      // Prepare documents for indexing (match exact Cognitive Search schema)
      const documentsToIndex = summaries.map((summary) => ({
        id: summary.id,
        Site_name: summary.Site_name,
        Product_family: summary.Product_Family,
        Total_incidents: summary.Total_incidents,
        Critical_count: summary.Critical_count,
        High_count: summary.High_count,
        Medium_count: summary.Medium_count,
        Low_count: summary.Low_count,
        Average_priority_score: summary.Average_priority_score,
        Average_resolution_time_hours: summary.Average_resolution_time_hours,
        Closed_count: summary.Closed_count,
        Open_count: summary.Open_count,
        Summary_text: `Site: ${summary.Site_name}, Product: ${summary.Product_Family}, Date: ${summary.date}, Total: ${summary.Total_incidents}, Critical: ${summary.Critical_count}, High: ${summary.High_count}, Medium: ${summary.Medium_count}, Low: ${summary.Low_count}`,
        last_updated: summary.last_updated,
      }));

      await cognitiveSearchService.mergeOrUploadDocuments(documentsToIndex);
      context.log(`Successfully indexed ${documentsToIndex.length} documents to Cognitive Search`);
    }

    // Prepare response with summary details
    const response = {
      success: true,
      date: targetDate,
      summariesGenerated: summaries.length,
      indexedToCognitiveSearch: summaries.length > 0 && !!env.COGNITIVE_SEARCH_INCIDENTS_INDEX_NAME,
      summaries: summaries.map((s) => ({
        id: s.id,
        Site_name: s.Site_name,
        Total_incidents: s.Total_incidents,
        Critical_count: s.Critical_count,
        High_count: s.High_count,
        Medium_count: s.Medium_count,
        Low_count: s.Low_count,
        Average_priority_score: s.Average_priority_score,
        Average_resolution_time_hours: s.Average_resolution_time_hours,
        Closed_count: s.Closed_count,
        Open_count: s.Open_count,
      })),
    };

    context.log('=== MANUAL INCIDENT SUMMARY TRIGGER COMPLETED ===');

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    context.error('Error generating incident summaries:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Failed to generate incident summaries',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// Register HTTP function
app.http('fn-trigger-incident-summary', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'trigger-incident-summary',
  handler: fnTriggerIncidentSummary,
});
