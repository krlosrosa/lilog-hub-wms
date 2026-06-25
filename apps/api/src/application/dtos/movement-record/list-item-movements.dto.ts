import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MovementTypeSchema } from '../../../domain/model/movement-record/movement-record.model.js';

export const ListItemMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  movementType: MovementTypeSchema.optional(),
  lotNumber: z.string().optional(),
});

export class ListItemMovementsQueryDto extends createZodDto(
  ListItemMovementsQuerySchema,
) {}

export const MovementRecordResponseSchema = z.object({
  id: z.uuid(),
  itemId: z.string(),
  lotNumber: z.string().nullable(),
  serialNumber: z.string().nullable(),
  fromLocation: z.string().nullable(),
  toLocation: z.string().nullable(),
  movementType: MovementTypeSchema,
  quantity: z.string(),
  unit: z.string(),
  operatorId: z.uuid(),
  documentRef: z.string().nullable(),
  notes: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export class MovementRecordResponseDto extends createZodDto(
  MovementRecordResponseSchema,
) {}

export const ListItemMovementsResponseSchema = z.object({
  items: z.array(MovementRecordResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListItemMovementsResponseDto extends createZodDto(
  ListItemMovementsResponseSchema,
) {}
