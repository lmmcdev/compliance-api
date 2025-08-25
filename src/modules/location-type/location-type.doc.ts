import { BaseDoc } from '../../shared/base.doc';

export interface LocationTypeDoc extends BaseDoc {
  code: string;
  displayName?: string | null;
  description?: string | null;
}
