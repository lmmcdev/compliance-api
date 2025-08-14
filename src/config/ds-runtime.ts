import AppDataSource from './data-source';
import type { DataSource } from 'typeorm';

let ds: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (ds?.isInitialized) return ds;
  ds = await AppDataSource.initialize();
  return ds;
}
