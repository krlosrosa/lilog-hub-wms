import type { SessaoPausaTipoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

export const TIPO_PAUSA_LABELS: Record<SessaoPausaTipoApi, string> = {
  termica: 'Pausa térmica',
  refeicao: 'Pausa refeição',
  outros: 'Outros',
};

export const PAUSA_RETORNO_BADGE_LABEL = 'Retorno atrasado';
export const PAUSA_RETORNO_ALERTA_TITULO = 'Deveria ter voltado';
