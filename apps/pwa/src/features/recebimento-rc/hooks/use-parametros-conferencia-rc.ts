import {
  DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA,
  type ParametrosRecebimentoConferencia,
} from '@/features/recebimento/types/recebimento.schema';
import { normalizeParametrosConferenciaV2 } from '@/features/recebimento-v2/lib/parametros-conferencia';
import { useParametrosConferenciaReplicache } from '@/lib/replicache/hooks';

export function useParametrosConferenciaRc(
  unidadeId: string | undefined,
): ParametrosRecebimentoConferencia {
  const parametros = useParametrosConferenciaReplicache(unidadeId);

  if (!parametros) {
    return { ...DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA };
  }

  return normalizeParametrosConferenciaV2(parametros);
}
