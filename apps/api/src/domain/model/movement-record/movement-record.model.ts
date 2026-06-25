import { z } from 'zod';

export const MovementTypeSchema = z.enum([
  'ENTRADA',
  'SAIDA',
  'TRANSFERENCIA',
  'AJUSTE',
  'DEVOLUCAO',
]);

export type MovementType = z.infer<typeof MovementTypeSchema>;

export const MovementRecordSchema = z.object({
  id: z.uuid(),
  itemId: z.string().min(1),
  lotNumber: z.string().nullable(),
  serialNumber: z.string().nullable(),
  fromLocation: z.string().nullable(),
  toLocation: z.string().nullable(),
  movementType: MovementTypeSchema,
  quantity: z.string(),
  unit: z.string().min(1),
  operatorId: z.uuid(),
  documentRef: z.string().nullable(),
  notes: z.string().nullable(),
  occurredAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type MovementRecord = z.infer<typeof MovementRecordSchema>;

export const CreateMovementRecordInputSchema = MovementRecordSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateMovementRecordInput = z.infer<
  typeof CreateMovementRecordInputSchema
>;
