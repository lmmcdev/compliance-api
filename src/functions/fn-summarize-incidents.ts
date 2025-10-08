import { app, InvocationContext, Timer } from '@azure/functions';
import { IncidentSummaryService } from '../modules/incident-summary/incident-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';
import { env } from '../config/env';

/**
 * Timer-triggered Azure Function to generate daily incident summaries
 * Runs daily at 2:00 AM UTC
 * NCRONTAB format: {second} {minute} {hour} {day} {month} {day-of-week}
 */
export async function fnSummarizeIncidents(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('=== INCIDENT SUMMARY TIMER FUNCTION STARTED ===');
  context.log('Timer schedule status:', myTimer.scheduleStatus);
  context.log('Execution time:', new Date().toISOString());

  try {
    // Create service instance
    const incidentSummaryService = await IncidentSummaryService.createInstance();

    // Generate summaries for yesterday's data (grouped by Site_name)
    const summaries = await incidentSummaryService.generateSummariesForYesterday(context);

    context.log(`Successfully generated ${summaries.length} incident summaries`);

    // Log summary details
    summaries.forEach((summary) => {
      context.log(
        `Summary: ${summary.id} - Site: ${summary.Site_name}, Total: ${summary.Total_incidents}, ` +
        `Critical: ${summary.Critical_count}, Avg Priority: ${summary.Average_priority_score}`
      );
    });

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

    context.log('=== INCIDENT SUMMARY TIMER FUNCTION COMPLETED ===');
  } catch (error) {
    context.error('Error generating incident summaries:', error);
    throw error;
  }
}

// Register timer function
// Schedule: Daily at 2:00 AM UTC (0 0 2 * * *)
app.timer('fn-summarize-incidents', {
  schedule: '0 0 2 * * *',
  handler: fnSummarizeIncidents,
});
