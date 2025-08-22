// src/shared/validation.ts
import { z } from 'zod';

// Accepts 8-4-4-4-12 hex with dashes (case-insensitive). Does NOT enforce RFC version.
export const uuidLoose = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID');

// Normalize to lowercase before use (nice for consistent storage/joins)
export const uuidLooseNormalized = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(uuidLoose);
