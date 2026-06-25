import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
});

export class ListAuditLogsQueryDto extends createZodDto(
  ListAuditLogsQuerySchema,
) {}

export const AuditLogResponseSchema = z.object({
  id: z.uuid(),
  userId: z.number().int().positive().nullable(),
  userEmail: z.string().email().nullable(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().nullable(),
  httpMethod: z.string(),
  httpPath: z.string(),
  httpStatus: z.number().int(),
  payload: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export class AuditLogResponseDto extends createZodDto(AuditLogResponseSchema) {}

export const ListAuditLogsResponseSchema = z.object({
  items: z.array(AuditLogResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListAuditLogsResponseDto extends createZodDto(
  ListAuditLogsResponseSchema,
) {}
