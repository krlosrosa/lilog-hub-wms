'use client';

import { useRegrasPausasListaCore } from '@/features/regras-pausas/hooks/use-regras-pausas-lista-core';
import { mapApiToRegraPausa } from '@/features/config-operacional/types/configuracao-operacional.api';

export function useRegrasPausasLista(tipo: 'termica' | 'refeicao' | 'outros') {
  return useRegrasPausasListaCore(tipo, mapApiToRegraPausa);
}
