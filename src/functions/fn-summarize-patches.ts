import { app, InvocationContext, Timer } from '@azure/functions';
import { PatchSummaryService } from '../modules/patch-summary/patch-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';

/**
 * Timer-triggered Azure Function to generate daily patch summaries
 * Runs daily at 1:00 AM UTC
 * NCRONTAB format: {second} {minute} {hour} {day} {month} {day-of-week}
 */
export async function fnSummarizePatches(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('=== PATCH SUMMARY TIMER FUNCTION STARTED ===');
  context.log('Timer schedule status:', myTimer.scheduleStatus);
  context.log('Execution time:', new Date().toISOString());

  try {
    // Create service instances
    const patchSummaryService = await PatchSummaryService.createInstance();
    const cognitiveSearchService = new CognitiveSearchService();

    // Generate summaries for yesterday's data (grouped by Site_name and KB_number)
    const summaries = await patchSummaryService.generateSummariesForYesterday(context);

    context.log(`Successfully generated ${summaries.length} patch summaries`);

    // Log summary details
    summaries.forEach((summary) => {
      context.log(`Summary: ${summary.id} - KB: ${summary.KB_number}, Site: ${summary.Site_name}, Devices: ${summary.Device_count}, Status: ${summary.Patch_status}`);
    });

    // Index summaries to Cognitive Search
    if (summaries.length > 0) {
      context.log('Indexing summaries to Cognitive Search...');

      // Prepare documents for indexing (remove Cosmos DB internal fields and doc_type, add Summary_text)
      const documentsToIndex = summaries.map((summary) => {
        const { _rid, _self, _etag, _attachments, _ts, doc_type, ...doc } = summary;
        return {
          ...doc,
          Summary_text: `KB: ${summary.KB_number}, Patch: ${summary.Patch_name}, Site: ${summary.Site_name}, Date: ${summary.Patch_installation_Date}, Devices: ${summary.Device_count}, Status: ${summary.Patch_status}, Classification: ${summary.Classification}`,
        };
      });

      await cognitiveSearchService.mergeOrUploadDocuments(documentsToIndex);
      context.log(`Successfully indexed ${documentsToIndex.length} documents to Cognitive Search`);
    }

    context.log('=== PATCH SUMMARY TIMER FUNCTION COMPLETED ===');
  } catch (error) {
    context.error('Error generating patch summaries:', error);
    throw error;
  }
}

// Register timer function
// Schedule: Daily at 1:00 AM UTC (0 0 1 * * *)
app.timer('fn-summarize-patches', {
  schedule: '0 0 1 * * *',
  handler: fnSummarizePatches,
});
