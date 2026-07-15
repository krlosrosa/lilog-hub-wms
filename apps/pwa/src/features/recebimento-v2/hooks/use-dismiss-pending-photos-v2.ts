import { useCallback } from 'react';
import { toast } from 'sonner';

import { resetAutoSyncBackoff } from '../services/auto-sync-v2.service';
import { dismissPendingPhotos } from '../services/sync-photo.helpers';

export function useDismissPendingPhotosV2(demandId: string) {
  return useCallback(async () => {
    const confirmed = window.confirm(
      'Descartar as fotos pendentes deste recebimento? Elas serão removidas deste aparelho e não serão enviadas ao servidor.',
    );

    if (!confirmed) {
      return;
    }

    const count = await dismissPendingPhotos(demandId);

    if (count === 0) {
      toast.info('Nenhuma foto pendente para descartar');
      return;
    }

    resetAutoSyncBackoff(demandId);
    toast.success(`${count} foto(s) descartada(s)`);
  }, [demandId]);
}
