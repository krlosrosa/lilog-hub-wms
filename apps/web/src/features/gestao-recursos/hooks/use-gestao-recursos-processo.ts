'use client';

import type { MapaGrupoProcessoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import { useGestaoRecursos } from '@/features/gestao-recursos/hooks/use-gestao-recursos';

export function useGestaoRecursosProcesso(processo: MapaGrupoProcessoApi) {
  return useGestaoRecursos({ processo });
}
