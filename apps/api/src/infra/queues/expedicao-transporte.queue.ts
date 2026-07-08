export const EXPEDICAO_TRANSPORTE_QUEUE = 'expedicao-transporte' as const;

export const JOB_RECALCULAR_STATUS = 'recalcular-status' as const;
export const JOB_SINCRONIZAR_VIAGEM_RAVEX = 'sincronizar-viagem-ravex' as const;

export const VIAGEM_RAVEX_DELAY_BUSCAR_MS = 15 * 60 * 1000;
export const VIAGEM_RAVEX_DELAY_INICIO_MS = 15 * 60 * 1000;
export const VIAGEM_RAVEX_DELAY_FIM_MS = 30 * 60 * 1000;

export type RecalcularStatusTransporteJobData = {
  transporteId: string;
  unidadeId: string;
  motivo: 'grupo_iniciado' | 'grupo_finalizado';
  mapaGrupoId: string;
  processo: 'separacao' | 'conferencia' | 'carregamento';
};

export type FaseSincronizacaoViagemRavex =
  | 'buscar_viagem'
  | 'aguardar_inicio'
  | 'aguardar_fim'
  | 'verificar_anomalias'
  | 'gerar_demanda_devolucao';

export type SincronizarViagemRavexJobData = {
  transporteId: string;
  unidadeId: string;
  fase: FaseSincronizacaoViagemRavex;
};
