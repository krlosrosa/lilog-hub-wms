import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.uuid(),
  userId: z.number().int().positive().nullable(),
  userEmail: z.string().email().nullable(),
  action: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().nullable(),
  httpMethod: z.string().min(1),
  httpPath: z.string().min(1),
  httpStatus: z.number().int(),
  payload: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const CreateAuditLogInputSchema = AuditLogSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogInputSchema>;
