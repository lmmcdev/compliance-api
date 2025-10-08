import { InvocationContext } from '@azure/functions';
import { AvanSummaryRepository } from './avanan-summary.repository';
import { AvanSummaryDoc } from './avanan-summary.doc';

export class AvanSummaryService {
  private constructor(
    private readonly avanSummaryRepository: AvanSummaryRepository,
  ) {}

  static async createInstance() {
    const avanSummaryRepository = await new AvanSummaryRepository().init();
    return new AvanSummaryService(avanSummaryRepository);
  }

  /**
   * Extract domain from email address
   */
  private extractDomain(email: string): string {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  /**
   * Parse spam verdict to number
   */
  private parseSpamVerdict(verdict: string): number {
    const num = parseInt(verdict, 10);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Extract hour from ISO date string
   */
  private extractHour(dateString: string): number {
    try {
      const date = new Date(dateString);
      return date.getUTCHours();
    } catch {
      return 0;
    }
  }

  /**
   * Classify threat type
   */
  private classifyThreat(report: any): string {
    if (report.Phishing_Combined_Verdict?.toLowerCase() === 'phishing') {
      return 'phishing';
    }
    if (report.Malicious_Combined_Verdict?.toLowerCase() === 'malware' ||
        report.Malicious_Combined_Verdict?.toLowerCase() === 'malicious') {
      return 'malware';
    }
    const spamVerdict = this.parseSpamVerdict(report.Spam_Verdict);
    if (spamVerdict >= 5) {
      return 'spam';
    }
    if (spamVerdict >= 1) {
      return 'graymail';
    }
    return 'clean';
  }

  /**
   * Generate avanan summary for a specific date
   */
  async generateSummaryForDate(date: string, ctx: InvocationContext): Promise<AvanSummaryDoc | null> {
    console.log('=== GENERATING AVANAN SUMMARY ===');
    console.log('Date:', date);

    const reports = await this.avanSummaryRepository.getReportsByDate(date);

    if (reports.length === 0) {
      console.log('No avanan reports found for this date');
      ctx.log(`No avanan report data found for date: ${date}`);
      return null;
    }

    console.log(`Processing ${reports.length} avanan reports`);

    // Initialize counters
    let phishingCount = 0;
    let malwareCount = 0;
    let spamCount = 0;
    let graymailCount = 0;
    let cleanCount = 0;

    const spamVerdictDistribution: { [key: string]: number } = {};
    const recipientThreats = new Map<string, {
      total: number;
      phishing: number;
      malware: number;
      spam: number;
    }>();
    const attackerDomains = new Map<string, {
      total: number;
      phishing: number;
    }>();
    const hourlyDistribution = new Array(24).fill(0);
    const attackTypes = new Map<string, number>();

    let microsoftDetections = 0;
    let spfFailures = 0;
    let dmarcFailures = 0;
    let quarantinedCount = 0;
    let spfPass = 0;
    let spfFail = 0;
    let dmarcPass = 0;
    let dmarcFail = 0;
    let dmarcNone = 0;
    let totalSpamVerdict = 0;

    // Process each report
    reports.forEach((report) => {
      // Classify threat
      const threatType = this.classifyThreat(report);
      switch (threatType) {
        case 'phishing':
          phishingCount++;
          break;
        case 'malware':
          malwareCount++;
          break;
        case 'spam':
          spamCount++;
          break;
        case 'graymail':
          graymailCount++;
          break;
        case 'clean':
          cleanCount++;
          break;
      }

      // Spam verdict distribution
      const verdict = report.Spam_Verdict || '0';
      spamVerdictDistribution[verdict] = (spamVerdictDistribution[verdict] || 0) + 1;
      totalSpamVerdict += this.parseSpamVerdict(verdict);

      // Track recipients (attacked users)
      const recipients = report.Recipients?.split(',') || [];
      recipients.forEach((recipient: string) => {
        const email = recipient.trim().toLowerCase();
        if (!email) return;

        if (!recipientThreats.has(email)) {
          recipientThreats.set(email, { total: 0, phishing: 0, malware: 0, spam: 0 });
        }
        const stats = recipientThreats.get(email)!;
        stats.total++;
        if (threatType === 'phishing') stats.phishing++;
        if (threatType === 'malware') stats.malware++;
        if (threatType === 'spam') stats.spam++;
      });

      // Track attacker domains
      const senderEmail = report.Sender_Email_Address?.toLowerCase() || '';
      const domain = this.extractDomain(senderEmail);
      if (domain !== 'unknown') {
        if (!attackerDomains.has(domain)) {
          attackerDomains.set(domain, { total: 0, phishing: 0 });
        }
        const domainStats = attackerDomains.get(domain)!;
        domainStats.total++;
        if (threatType === 'phishing') domainStats.phishing++;
      }

      // Hourly distribution
      const hour = this.extractHour(report.Date);
      hourlyDistribution[hour]++;

      // Detection methods
      if (report.Microsoft_Verdict) microsoftDetections++;
      if (report.SPF_Result?.toLowerCase() === 'fail') spfFailures++;
      if (report.DMARC_Result?.toLowerCase() === 'fail') dmarcFailures++;
      if (report.Quarantined_State?.toLowerCase() === 'true') quarantinedCount++;

      // Authentication stats
      const spfResult = report.SPF_Result?.toLowerCase() || '';
      const dmarcResult = report.DMARC_Result?.toLowerCase() || '';

      if (spfResult === 'pass') spfPass++;
      else if (spfResult === 'fail') spfFail++;

      if (dmarcResult === 'pass') dmarcPass++;
      else if (dmarcResult === 'fail') dmarcFail++;
      else if (dmarcResult === 'none') dmarcNone++;

      // Attack types from Detection_Reason
      const detectionReason = report.Detection_Reason || '';
      const reasons = detectionReason.split(',').map((r: string) => r.trim());
      reasons.forEach((reason: string) => {
        if (reason) {
          attackTypes.set(reason, (attackTypes.get(reason) || 0) + 1);
        }
      });
    });

    // Build top attacked users
    const topAttackedUsers = Array.from(recipientThreats.entries())
      .map(([recipient, stats]) => ({
        recipient,
        threat_count: stats.total,
        phishing_count: stats.phishing,
        malware_count: stats.malware,
        spam_count: stats.spam,
      }))
      .sort((a, b) => b.threat_count - a.threat_count)
      .slice(0, 10);

    // Build top attacker domains
    const topAttackerDomains = Array.from(attackerDomains.entries())
      .map(([domain, stats]) => ({
        domain,
        email_count: stats.total,
        phishing_count: stats.phishing,
      }))
      .sort((a, b) => b.email_count - a.email_count)
      .slice(0, 10);

    // Build hourly distribution array
    const hourlyDistArray = hourlyDistribution.map((count, hour) => ({
      hour,
      threat_count: count,
    }));

    // Build top attack types
    const topAttackTypes = Array.from(attackTypes.entries())
      .map(([attack_type, count]) => ({ attack_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average spam verdict
    const averageSpamVerdict = reports.length > 0
      ? Math.round((totalSpamVerdict / reports.length) * 100) / 100
      : 0;

    // Create summary document
    const summary: AvanSummaryDoc = {
      id: `Avanan_Summary_${date}`,
      doc_type: 'avanan_phishing_summary',
      date,
      Total_emails_analyzed: reports.length,
      Phishing_count: phishingCount,
      Malware_count: malwareCount,
      Spam_count: spamCount,
      Graymail_count: graymailCount,
      Clean_count: cleanCount,
      Spam_verdict_distribution: spamVerdictDistribution,
      Top_attacked_users: topAttackedUsers,
      Top_attacker_domains: topAttackerDomains,
      Detection_methods: {
        Microsoft_detections: microsoftDetections,
        SPF_failures: spfFailures,
        DMARC_failures: dmarcFailures,
        Quarantined: quarantinedCount,
      },
      Hourly_distribution: hourlyDistArray,
      Average_spam_verdict: averageSpamVerdict,
      Top_attack_types: topAttackTypes,
      Authentication_stats: {
        SPF_pass: spfPass,
        SPF_fail: spfFail,
        DMARC_pass: dmarcPass,
        DMARC_fail: dmarcFail,
        DMARC_none: dmarcNone,
      },
      last_updated: new Date().toISOString(),
    };

    // Upsert to Cosmos DB
    const upsertedSummary = await this.avanSummaryRepository.upsertSummary(summary);

    console.log('=== AVANAN SUMMARY COMPLETE ===');
    console.log(`Summary created for ${date}:`, {
      Total_emails: reports.length,
      Phishing: phishingCount,
      Malware: malwareCount,
      Spam: spamCount,
    });

    return upsertedSummary;
  }

  /**
   * Generate summary for yesterday (default for timer)
   */
  async generateSummaryForYesterday(ctx: InvocationContext): Promise<AvanSummaryDoc | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    return this.generateSummaryForDate(date, ctx);
  }
}
