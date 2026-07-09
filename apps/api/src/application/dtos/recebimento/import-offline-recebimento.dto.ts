import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { OfflineImportEntrySchema } from '../../../domain/model/offline-import/offline-import.model.js';

export const ImportOfflineRecebimentoResponseSchema = z.object({
  demandId: z.string(),
  recebimentoId: z.string(),
  exportId: z.string(),
  appliedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errors: z.array(
    z.object({
      label: z.string(),
      message: z.string(),
    }),
  ),
});

export class ImportOfflineRecebimentoResponseDto extends createZodDto(
  ImportOfflineRecebimentoResponseSchema,
) {}

export { OfflineImportEntrySchema };
