import { parse } from 'csv-parse/sync';

export class CsvParserService {
  /**
   * Parse CSV content with proper handling of quoted fields and commas
   * @param csvContent - Raw CSV string content
   * @param options - Parsing options
   * @returns Parsed CSV data as array of objects
   */
  static parseCSV(
    csvContent: string,
    options?: {
      delimiter?: string;
      columns?: boolean | string[];
      skipEmptyLines?: boolean;
      trim?: boolean;
    }
  ): any[] {
    const defaultOptions = {
      delimiter: ',',
      columns: true, // Use first row as header
      skipEmptyLines: true,
      trim: true,
      relax_quotes: true, // Allow quotes to appear in unquoted fields
      relax_column_count: true, // Don't fail if column count varies
      ...options,
    };

    try {
      const records = parse(csvContent, defaultOptions);
      return records;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate and format CSV data
   * Returns cleaned data with statistics
   */
  static formatCSV(csvContent: string): {
    data: any[];
    stats: {
      totalRows: number;
      totalColumns: number;
      headers: string[];
    };
  } {
    const data = this.parseCSV(csvContent);

    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    return {
      data,
      stats: {
        totalRows: data.length,
        totalColumns: headers.length,
        headers,
      },
    };
  }
}
