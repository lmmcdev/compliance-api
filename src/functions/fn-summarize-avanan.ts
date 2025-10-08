import { app, InvocationContext, Timer } from '@azure/functions';
import { AvanSummaryService } from '../modules/avanan-summary/avanan-summary.service';
import { CognitiveSearchService } from '../infrastructure/cognitive-search';
import { env } from '../config/env';

/**
 * Timer-triggered Azure Function to generate daily Avanan phishing report summaries
 * Runs daily at 3:00 AM UTC
 * NCRONTAB format: {second} {minute} {hour} {day} {month} {day-of-week}
 */
export async function fnSummarizeAvanan(myTimer: Timer, context: InvocationContext): Promise<void> {
  context.log('=== AVANAN SUMMARY TIMER FUNCTION STARTED ===');
  context.log('Timer schedule status:', myTimer.scheduleStatus);
  context.log('Execution time:', new Date().toISOString());

  try {
    // Create service instances
    const avanSummaryService = await AvanSummaryService.createInstance();

    // Generate summary for yesterday's data
    const summary = await avanSummaryService.generateSummaryForYesterday(context);

    if (!summary) {
      context.log('No data to summarize for yesterday');
      return;
    }

    context.log(`Successfully generated avanan summary for ${summary.date}`);
    context.log(`Total emails analyzed: ${summary.Total_emails_analyzed}`);
    context.log(`Phishing: ${summary.Phishing_count}, Malware: ${summary.Malware_count}, Spam: ${summary.Spam_count}`);

    // Index to Cognitive Search
    if (env.COGNITIVE_SEARCH_AVANAN_INDEX_NAME) {
      context.log('Indexing summary to Cognitive Search...');

      const cognitiveSearchService = new CognitiveSearchService(
        env.COGNITIVE_SEARCH_AVANAN_INDEX_NAME
      );

      // Map summary to Cognitive Search document (include all schema fields)
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
      context.log('Successfully indexed summary to Cognitive Search');
    }

    context.log('=== AVANAN SUMMARY TIMER FUNCTION COMPLETED ===');
  } catch (error) {
    context.error('Error generating avanan summary:', error);
    throw error;
  }
}

// Register timer function
// Schedule: Daily at 3:00 AM UTC (0 0 3 * * *)
app.timer('fn-summarize-avanan', {
  schedule: '0 0 3 * * *',
  handler: fnSummarizeAvanan,
});
