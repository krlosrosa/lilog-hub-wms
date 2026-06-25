import type { SessaoPausaTipoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

export type OperatorStatus = 'atuando' | 'ocioso' | 'pausa';

export type PausaMonitorStatus = 'em-tempo' | 'atrasado';

export type TaskItem = {
  id: string;
  mapaGrupoId?: string;
  label: string;
  startTime?: string;
  expectedEndTime?: string;
  estimatedSeconds?: number;
  pausaExtraMinutos?: number;
  progress?: number;
  status?: 'em_andamento' | 'pendente';
  isLate?: boolean;
};

export type Operator = {
  id: string;
  name: string;
  sector: string;
  status: OperatorStatus;
  currentMission?: string;
  startTime?: string;
  progress?: number;
  expectedEnd?: string;
  isLate?: boolean;
  idleDuration?: string;
  idleThreshold?: number;
  emPausa?: boolean;
  pauseDuration?: string;
  pauseThreshold?: number;
  pauseTipo?: SessaoPausaTipoApi;
  pausePrevisaoRetorno?: string;
  pauseStatus?: PausaMonitorStatus;
  pauseTempoRestante?: string;
  isPauseOverPlanned?: boolean;
  pauseAtrasoRetornoMinutos?: number;
  pauseElapsedMinutos?: number;
  precisaPausa?: boolean;
  pausaTipoSugerido?: SessaoPausaTipoApi;
  tempoTrabalhoContinuoMinutos?: number;
  intervaloPausaReferenciaMinutos?: number;
  duracaoPausaSugeridaMinutos?: number;
  pausaAtrasoMinutos?: number;
  pausaTempoRestanteMinutos?: number;
  pausaDevidaProgress?: number;
  tasks?: TaskItem[];
};

export type KpiAccent =
  | 'primary'
  | 'tertiary'
  | 'destructive'
  | 'muted'
  | 'warning';

export type KpiCard = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  progress?: number;
  footer?: string;
  accent: KpiAccent;
};

export type GestaoRecursosFilter =
  | 'all'
  | 'atuando'
  | 'precisa_pausa'
  | 'em_pausa'
  | 'ociosos';
