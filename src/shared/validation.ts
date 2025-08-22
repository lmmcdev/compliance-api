// src/shared/validation.ts
import { z } from 'zod';

export const uuidLoose = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID');

export const uuidLooseNormalized = z
  .string()
  .transform((v) => v.toLowerCase())
  .pipe(uuidLoose);
