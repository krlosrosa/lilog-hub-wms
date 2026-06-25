import type { CreateAuditLogInput } from '../../model/audit-log/audit-log.model.js';

export const AUDIT_LOG_REPOSITORY = 'IAuditLogRepository';

export type AuditLogRecord = CreateAuditLogInput & {
  id: string;
  createdAt: Date;
};

export type ListAuditLogsFilter = {
  page?: number;
  limit?: number;
  userId?: number;
  resource?: string;
  action?: string;
};

export type ListAuditLogsResult = {
  items: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IAuditLogRepository {
  create(data: CreateAuditLogInput): Promise<AuditLogRecord>;
  list(filter: ListAuditLogsFilter): Promise<ListAuditLogsResult>;
}
