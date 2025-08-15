import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2', default: () => 'GETUTCDATE()' })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime2',
    default: () => 'GETUTCDATE()',
    onUpdate: 'GETUTCDATE()',
  })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime2', nullable: true, default: null })
  deletedAt?: Date | null;
}
