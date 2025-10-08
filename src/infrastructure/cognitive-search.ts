import { SearchClient, AzureKeyCredential } from '@azure/search-documents';
import { env } from '../config/env';

/**
 * Azure Cognitive Search client for indexing documents
 */
export class CognitiveSearchService {
  private searchClient: SearchClient<any>;

  constructor(indexName?: string) {
    if (!env.COGNITIVE_SEARCH_ENDPOINT) {
      throw new Error('COGNITIVE_SEARCH_ENDPOINT is not configured');
    }

    if (!env.COGNITIVE_SEARCH_KEY) {
      throw new Error('COGNITIVE_SEARCH_KEY is not configured');
    }

    // Use provided index name or default to winpatch index
    const targetIndexName = indexName || env.COGNITIVE_SEARCH_WINPATCH_INDEX_NAME;

    this.searchClient = new SearchClient(
      env.COGNITIVE_SEARCH_ENDPOINT,
      targetIndexName,
      new AzureKeyCredential(env.COGNITIVE_SEARCH_KEY)
    );

    console.log('Cognitive Search client initialized:', {
      endpoint: env.COGNITIVE_SEARCH_ENDPOINT,
      indexName: targetIndexName,
    });
  }

  /**
   * Upload or merge documents to the search index
   */
  async uploadDocuments(documents: any[]): Promise<void> {
    if (documents.length === 0) {
      console.log('No documents to upload to Cognitive Search');
      return;
    }

    try {
      const result = await this.searchClient.uploadDocuments(documents);

      console.log('Documents uploaded to Cognitive Search:', {
        totalDocuments: documents.length,
        succeeded: result.results.filter((r) => r.succeeded).length,
        failed: result.results.filter((r) => !r.succeeded).length,
      });

      // Log any failures
      const failures = result.results.filter((r) => !r.succeeded);
      if (failures.length > 0) {
        console.error('Failed to index some documents:', failures);
      }
    } catch (error) {
      console.error('Error uploading documents to Cognitive Search:', error);
      throw error;
    }
  }

  /**
   * Merge or upload documents (creates if not exists, updates if exists)
   */
  async mergeOrUploadDocuments(documents: any[]): Promise<void> {
    if (documents.length === 0) {
      console.log('No documents to merge/upload to Cognitive Search');
      return;
    }

    try {
      const result = await this.searchClient.mergeOrUploadDocuments(documents);

      console.log('Documents merged/uploaded to Cognitive Search:', {
        totalDocuments: documents.length,
        succeeded: result.results.filter((r) => r.succeeded).length,
        failed: result.results.filter((r) => !r.succeeded).length,
      });

      // Log any failures
      const failures = result.results.filter((r) => !r.succeeded);
      if (failures.length > 0) {
        console.error('Failed to merge/upload some documents:', failures);
      }
    } catch (error) {
      console.error('Error merging/uploading documents to Cognitive Search:', error);
      throw error;
    }
  }
}
