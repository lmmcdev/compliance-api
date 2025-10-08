import { Container, SqlQuerySpec } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { AvanSummaryDoc } from './avanan-summary.doc';

const CONTAINER_ID = 'avanan_reports';

export class AvanSummaryRepository {
  private container!: Container;
  private summaryContainer!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: '/id' });
    this.summaryContainer = await getContainer({
      id: 'avanan_reports',
      partitionKeyPath: '/id'
    });
    return this;
  }

  /**
   * Get all avanan reports for a specific date
   */
  async getReportsByDate(date: string): Promise<Array<{
    Date: string;
    Sender_Email_Address: string;
    Recipients: string;
    Subject: string;
    Phishing_Combined_Verdict: string;
    Malicious_Combined_Verdict: string;
    Spam_Verdict: string;
    Detection_Reason: string;
    Microsoft_Verdict: string;
    SPF_Result: string;
    DMARC_Result: string;
    Quarantined_State: string;
  }>> {
    const query: SqlQuerySpec = {
      query: `SELECT c.Date, c.Sender_Email_Address, c.Recipients, c.Subject,
              c.Phishing_Combined_Verdict, c.Malicious_Combined_Verdict,
              c.Spam_Verdict, c.Detection_Reason, c.Microsoft_Verdict,
              c.SPF_Result, c.DMARC_Result, c.Quarantined_State
              FROM c
              WHERE c.doc_type = @doc_type
              AND STARTSWITH(c.Date, @datePrefix)`,
      parameters: [
        { name: '@doc_type', value: 'avanan_phishing_report' },
        { name: '@datePrefix', value: date }
      ]
    };

    const { resources } = await this.container.items
      .query<any>(query)
      .fetchAll();

    return resources || [];
  }

  /**
   * Upsert summary to Cosmos DB
   */
  async upsertSummary(summary: AvanSummaryDoc): Promise<AvanSummaryDoc> {
    const { resource } = await this.summaryContainer.items.upsert(summary);
    return resource as AvanSummaryDoc;
  }
}
