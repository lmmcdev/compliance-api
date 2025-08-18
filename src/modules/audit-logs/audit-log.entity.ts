import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared';
import { EntityName } from '../../types';

@Entity({ name: 'audit_logs', schema: 'dbo' })
export class AuditLog extends BaseEntity {
  @Column({ type: 'nvarchar', length: 128 })
  action!: string;

  @Column({ type: 'nvarchar', length: 128 })
  entityName!: EntityName;

  @Column({ type: 'uniqueidentifier', nullable: true })
  entityId?: string | null;

  @Column({ type: 'uniqueidentifier', nullable: true })
  userId?: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  details?: string | null;
}
