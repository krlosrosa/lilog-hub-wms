import { z } from 'zod';

export const OfflineImportEntrySchema = z.object({
  outboxId: z.coerce.number().int().optional(),
  label: z.string().min(1).max(500),
  endpoint: z.string().min(1).max(500),
  method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']),
  payload: z.unknown(),
  createdAt: z.coerce.number().int().nonnegative(),
  photoRefs: z
    .array(
      z.object({
        photoId: z.coerce.number().int(),
        outboxId: z.coerce.number().int(),
        filename: z.string().min(1),
        mimeType: z.string().min(1),
        relatedId: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
});

export type OfflineImportEntry = z.infer<typeof OfflineImportEntrySchema>;

export const CreateOfflineImportLogInputSchema = z.object({
  exportId: z.string().min(1).max(64),
  demandId: z.string().min(1).max(100),
  entryKey: z.string().min(1).max(128),
  endpoint: z.string().min(1).max(500),
  method: z.string().min(1).max(10),
  label: z.string().min(1).max(500),
  status: z.enum(['applied', 'skipped', 'error']),
  errorMessage: z.string().max(1000).optional(),
  userId: z.number().int().nullable().optional(),
});

export type CreateOfflineImportLogInput = z.infer<
  typeof CreateOfflineImportLogInputSchema
>;

export const OfflineImportLogSchema = CreateOfflineImportLogInputSchema.extend({
  id: z.uuid(),
  appliedAt: z.coerce.date(),
});

export type OfflineImportLog = z.infer<typeof OfflineImportLogSchema>;
