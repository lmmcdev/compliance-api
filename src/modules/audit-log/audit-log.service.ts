import {
  CreateAuditLogSchema,
  CreateAuditLogDto,
  ListAuditLogsSchema,
  ListAuditLogsQuery,
} from './audit-log.dto';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLogDoc } from './audit-log.doc';

export interface IAuditLogService {
  log(payload: unknown): Promise<AuditLogDoc>;
  list(query: unknown): Promise<{ items: AuditLogDoc[]; continuationToken: string | null }>;
}

export class AuditLogService implements IAuditLogService {
  constructor(private readonly repo: AuditLogRepository) {}
  static async createInstance(): Promise<AuditLogService> {
    const repo = await new AuditLogRepository().init();
    return new AuditLogService(repo);
  }
  async log(payload: unknown): Promise<AuditLogDoc> {
    const dto: CreateAuditLogDto = CreateAuditLogSchema.parse(payload);
    return this.repo.create(dto);
  }
  async list(query: unknown) {
    const q: ListAuditLogsQuery = ListAuditLogsSchema.parse(query);
    return this.repo.list(q);
  }
}
