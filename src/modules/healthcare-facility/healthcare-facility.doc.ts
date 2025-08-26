// src/modules/healthcare-facility/healthcare-facility.doc.ts
import { BaseDoc } from '../../shared/base.doc';

export interface HealthcareFacilityDoc extends BaseDoc {
  // PK (todas las facilities de una cuenta quedan en la misma partición)
  accountId: string;

  name: string;

  location?: string | null;
  locationType?: string | null;

  licensedBedCount?: number | null;

  facilityType?: string | null;

  availabilityExceptions?: string | null;
  alwaysOpen?: boolean; // default: false

  sourceSystem?: string | null;
  sourceSystemId?: string | null;
  /** ISO string */
  sourceSystemModified?: string | null;

  /** FK a Address (si la usas) */
  addressId?: string | null;
}
