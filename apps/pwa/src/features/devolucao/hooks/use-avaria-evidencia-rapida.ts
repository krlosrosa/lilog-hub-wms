import { usePhotoCapture } from '@/lib/offline/hooks/use-photo-capture';

import { buildAvariaRelatedId } from '../lib/avaria-evidencia-utils';

export function useAvariaEvidenciaRapida(demandId: string, sku?: string) {
  return usePhotoCapture({
    relatedId: buildAvariaRelatedId(demandId, sku),
  });
}
