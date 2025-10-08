import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { PatchSummaryService } from '../modules/patch-summary/patch-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';

/**
 * HTTP-triggered Azure Function to manually trigger patch summary generation
 * This is useful for testing and manual runs
 */
export async function fnTriggerPatchSummary(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('=== MANUAL PATCH SUMMARY TRIGGER ===');
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
            example: '2025-10-07',
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

    // Create service instances
    const patchSummaryService = await PatchSummaryService.createInstance();
    const cognitiveSearchService = new CognitiveSearchService();

    // Generate summaries for the target date
    const summaries = await patchSummaryService.generateSummariesForDate(targetDate, context);

    context.log(`Successfully generated ${summaries.length} patch summaries`);

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

    // Prepare response with summary details
    const response = {
      success: true,
      date: targetDate,
      summariesGenerated: summaries.length,
      indexedToCognitiveSearch: summaries.length > 0,
      summaries: summaries.map((s) => ({
        id: s.id,
        KB_number: s.KB_number,
        Site_name: s.Site_name,
        Device_count: s.Device_count,
        Patch_status: s.Patch_status,
        Classification: s.Classification,
      })),
    };

    context.log('=== MANUAL PATCH SUMMARY TRIGGER COMPLETED ===');

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    context.error('Error generating patch summaries:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Failed to generate patch summaries',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// Register HTTP function
app.http('fn-trigger-patch-summary', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'trigger-patch-summary',
  handler: fnTriggerPatchSummary,
});
