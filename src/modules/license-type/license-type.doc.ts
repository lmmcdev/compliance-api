// src/modules/license-type/license-type.doc.ts
import { BaseDoc } from '../../shared/base.doc';
export interface LicenseTypeDoc extends BaseDoc {
  code: string;
  displayName?: string | null;
  description?: string | null;
}
