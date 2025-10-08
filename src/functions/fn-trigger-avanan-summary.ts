import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AvanSummaryService } from '../modules/avanan-summary/avanan-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';
import { env } from '../config/env';

/**
 * HTTP-triggered Azure Function to manually trigger avanan summary generation
 * This is useful for testing and manual runs
 */
export async function fnTriggerAvanSummary(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('=== MANUAL AVANAN SUMMARY TRIGGER ===');
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
            example: '2025-10-06',
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
    const avanSummaryService = await AvanSummaryService.createInstance();

    // Generate summary for the target date
    const summary = await avanSummaryService.generateSummaryForDate(targetDate, context);

    if (!summary) {
      context.log('No data found for the specified date');
      return {
        status: 200,
        jsonBody: {
          success: true,
          date: targetDate,
          message: 'No avanan reports found for this date',
          summaryGenerated: false,
        },
      };
    }

    context.log(`Successfully generated avanan summary`);

    // Index to Cognitive Search
    let indexedToCognitiveSearch = false;
    if (env.COGNITIVE_SEARCH_AVANAN_INDEX_NAME) {
      context.log('Indexing summary to Cognitive Search...');

      const cognitiveSearchService = new CognitiveSearchService(
        env.COGNITIVE_SEARCH_AVANAN_INDEX_NAME
      );

      const documentToIndex = {
        id: summary.id,
        Total_emails_analyzed: summary.Total_emails_analyzed,
        Phishing_count: summary.Phishing_count,
        Malware_count: summary.Malware_count,
        Spam_count: summary.Spam_count,
        Graymail_count: summary.Graymail_count,
        Clean_count: summary.Clean_count,
        Average_spam_verdict: summary.Average_spam_verdict,
        Top_attacked_users: summary.Top_attacked_users,
        Top_attacker_domains: summary.Top_attacker_domains,
        Detection_methods: summary.Detection_methods,
        Top_attack_types: summary.Top_attack_types,
        Authentication_stats: summary.Authentication_stats,
        Summary_text: `Avanan Report ${summary.date}: ${summary.Total_emails_analyzed} emails analyzed, ${summary.Phishing_count} phishing, ${summary.Malware_count} malware, ${summary.Spam_count} spam. Top attacked user: ${summary.Top_attacked_users[0]?.recipient || 'N/A'} with ${summary.Top_attacked_users[0]?.threat_count || 0} threats. Top attacker domain: ${summary.Top_attacker_domains[0]?.domain || 'N/A'} with ${summary.Top_attacker_domains[0]?.email_count || 0} emails.`,
        last_updated: summary.last_updated,
      };

      await cognitiveSearchService.mergeOrUploadDocuments([documentToIndex]);
      context.log('Successfully indexed to Cognitive Search');
      indexedToCognitiveSearch = true;
    }

    // Prepare response
    const response = {
      success: true,
      date: targetDate,
      summaryGenerated: true,
      indexedToCognitiveSearch,
      summary: {
        id: summary.id,
        Total_emails_analyzed: summary.Total_emails_analyzed,
        Phishing_count: summary.Phishing_count,
        Malware_count: summary.Malware_count,
        Spam_count: summary.Spam_count,
        Graymail_count: summary.Graymail_count,
        Clean_count: summary.Clean_count,
        Average_spam_verdict: summary.Average_spam_verdict,
        Top_attacked_users: summary.Top_attacked_users.slice(0, 5),
        Top_attacker_domains: summary.Top_attacker_domains.slice(0, 5),
        Detection_methods: summary.Detection_methods,
        Top_attack_types: summary.Top_attack_types.slice(0, 5),
        Authentication_stats: summary.Authentication_stats,
      },
    };

    context.log('=== MANUAL AVANAN SUMMARY TRIGGER COMPLETED ===');

    return {
      status: 200,
      jsonBody: response,
    };
  } catch (error) {
    context.error('Error generating avanan summary:', error);

    return {
      status: 500,
      jsonBody: {
        error: 'Failed to generate avanan summary',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// Register HTTP function
app.http('fn-trigger-avanan-summary', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'trigger-avanan-summary',
  handler: fnTriggerAvanSummary,
});
