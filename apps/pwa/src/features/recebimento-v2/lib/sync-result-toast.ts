import { toast } from 'sonner';

import type { PushResult } from '../services/sync.service';

export function showSyncResultToast(
  result: PushResult,
  options?: { hadPhotos?: boolean },
): void {
  const hadPhotos = options?.hadPhotos ?? false;

  if (result.conflicts > 0) {
    toast.warning(`${result.conflicts} conflito(s) detectado(s). Veja detalhes no painel de sync.`);
    return;
  }

  if (result.rejected > 0) {
    const suffix =
      result.accepted > 0
        ? ` · ${result.accepted} operação(ões) sincronizada(s)`
        : '';
    toast.error(
      `${result.rejected} operação(ões) rejeitada(s). Veja detalhes no painel de sync.${suffix}`,
    );
    if (result.accepted === 0) {
      return;
    }
  }

  if (result.accepted > 0) {
    const photoSuffix =
      result.photosUploaded > 0 ? ` · ${result.photosUploaded} foto(s) enviada(s)` : '';
    toast.success(`${result.accepted} operação(ões) sincronizada(s)${photoSuffix}`);
    return;
  }

  if (hadPhotos) {
    if (result.photosUploaded > 0 && result.photosPending === 0) {
      toast.success('Fotos enviadas');
      return;
    }

    if (result.photosUploaded > 0) {
      toast.warning(
        `${result.photosUploaded} foto(s) enviada(s), ${result.photosPending} ainda pendente(s)`,
      );
      return;
    }

    toast.error(
      'Não foi possível enviar as fotos. Sincronize as avarias primeiro e tente novamente.',
    );
    return;
  }

  if (result.photosPending > 0) {
    toast.warning(`${result.photosPending} foto(s) ainda pendente(s)`);
    return;
  }

  toast.info('Nada para sincronizar');
}
