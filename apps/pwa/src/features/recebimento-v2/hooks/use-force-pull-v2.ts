import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { hapticMedium } from '@/lib/haptics';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { countPullOverwriteRisk, pullDemand } from '../services/sync.service';

export function useForcePullV2(demandId: string) {
  const { isOnline } = useNetworkStatus();
  const [isPulling, setIsPulling] = useState(false);

  const forcePull = useCallback(async () => {
    if (!isOnline) {
      toast.error('Sem conexão. Conecte-se à internet para atualizar do servidor.');
      return;
    }

    const pendingLocalOps = await countPullOverwriteRisk(demandId);
    if (
      pendingLocalOps > 0 &&
      !confirm(
        `Você tem ${pendingLocalOps} alteração(ões) local(is) não enviada(s).\n\nAtualizar do servidor vai descartar essas alterações e substituir pelos dados do banco.\n\nDeseja continuar?`,
      )
    ) {
      return;
    }

    setIsPulling(true);
    try {
      await pullDemand(demandId, { force: true });
      hapticMedium();
      toast.success('Dados atualizados do servidor');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar do servidor');
    } finally {
      setIsPulling(false);
    }
  }, [demandId, isOnline]);

  return {
    forcePull,
    isPulling,
    pullDisabled: !isOnline,
  };
}
