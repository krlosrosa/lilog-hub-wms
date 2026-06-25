export const AUDIT_LOG_QUEUE = 'audit-log' as const;

export const JOB_REGISTRAR_AUDIT = 'registrar-audit' as const;

export type RegistrarAuditJobData = {
  userId: number | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  httpMethod: string;
  httpPath: string;
  httpStatus: number;
  payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
};
