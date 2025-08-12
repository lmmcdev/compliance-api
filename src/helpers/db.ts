import { AppDataSource } from '../config/dataSource';
import { DataSource } from 'typeorm';

let cached: DataSource | null = null;

export async function getDb(): Promise<DataSource> {
  if (cached && cached.isInitialized) return cached;
  if (!cached) cached = AppDataSource;
  if (!cached.isInitialized) await cached.initialize();
  return cached;
}
