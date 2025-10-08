import { Container } from '@azure/cosmos';
import { getContainer } from '../../infrastructure/cosmos';
import { IncidentSummaryDoc } from './incident-summary.doc';

const CONTAINER_ID = 'incidents';
const PK_PATH = '/id';

export class IncidentSummaryRepository {
  private container!: Container;

  async init() {
    this.container = await getContainer({ id: CONTAINER_ID, partitionKeyPath: PK_PATH });
    return this;
  }

  /**
   * Upsert (create or update) an incident summary document
   */
  async upsertSummary(summary: IncidentSummaryDoc): Promise<IncidentSummaryDoc> {
    const { resource } = await this.container.items.upsert(summary);

    console.log('Incident summary upserted:', {
      id: summary.id,
      Site_name: summary.Site_name,
      Total_incidents: summary.Total_incidents,
    });

    return resource as IncidentSummaryDoc;
  }

  /**
   * Get unique sites from it_incident documents for a specific date
   */
  async getSitesForDate(date: string): Promise<string[]> {
    const query = {
      query: `SELECT DISTINCT VALUE c.Machine_name FROM c
              WHERE c.doc_type = @doc_type
              AND STARTSWITH(c.Ticket_created_Time, @datePrefix)`,
      parameters: [
        { name: '@doc_type', value: 'it_incident' },
        { name: '@datePrefix', value: date }, // YYYY-MM-DD format
      ],
    };

    const { resources } = await this.container.items.query<string>(query).fetchAll();

    console.log('Sites found for date:', {
      date,
      sitesCount: resources?.length || 0,
    });

    return resources?.filter((site) => site && site.trim() !== '') || [];
  }

  /**
   * Get incident data for a specific site, product family, and date
   */
  async getIncidentsBySiteProductAndDate(site: string, productFamily: string, date: string): Promise<{
    Ticket_priority: string;
    Activity_status: string;
    Ticket_created_Time: string;
    Ticket_resolved_Time?: string;
  }[]> {
    const query = {
      query: `SELECT
                c.Ticket_priority,
                c.Activity_status,
                c.Ticket_created_Time,
                c.Ticket_resolved_Time
              FROM c
              WHERE c.doc_type = @doc_type
              AND c.Machine_name = @site
              AND c.Product_Family = @productFamily
              AND STARTSWITH(c.Ticket_created_Time, @datePrefix)`,
      parameters: [
        { name: '@doc_type', value: 'it_incident' },
        { name: '@site', value: site },
        { name: '@productFamily', value: productFamily },
        { name: '@datePrefix', value: date },
      ],
    };

    const { resources } = await this.container.items
      .query<{
        Ticket_priority: string;
        Activity_status: string;
        Ticket_created_Time: string;
        Ticket_resolved_Time?: string;
      }>(query)
      .fetchAll();

    console.log('Incidents fetched:', {
      site,
      productFamily,
      date,
      incidentsCount: resources?.length || 0,
    });

    return resources || [];
  }

  /**
   * Get unique combinations of Site_name and Product_Family for a specific date
   */
  async getSiteProductCombinationsForDate(date: string): Promise<{ site: string; productFamily: string }[]> {
    const query = {
      query: `SELECT DISTINCT c.Machine_name as site, c.Product_Family as productFamily
              FROM c
              WHERE c.doc_type = @doc_type
              AND STARTSWITH(c.Ticket_created_Time, @datePrefix)`,
      parameters: [
        { name: '@doc_type', value: 'it_incident' },
        { name: '@datePrefix', value: date },
      ],
    };

    const { resources } = await this.container.items
      .query<{ site: string; productFamily: string }>(query)
      .fetchAll();

    console.log('Site-Product combinations found for date:', {
      date,
      combinationsCount: resources?.length || 0,
    });

    return (resources || []).filter((combo) => combo.site && combo.productFamily);
  }
}
