import type {
  ChartDia,
  MonitorStats,
  OperadorEmPausa,
  PausaRegistroDetalhe,
  RegistroOperador,
  RelatorioFooterKpi,
  RelatorioPronto,
} from '@/features/pausas/types/pausas.schema';

/** @deprecated Mock data — hooks use live API. Kept for reference only. */
export const MOCK_MONITOR_STATS: MonitorStats = {
  emPausa: 14,
  totalOperadores: 120,
  atrasosCriticos: 3,
  totalPausadoMinutos: 180,
  pausaMaisLonga: '45 min',
  pausaMaisLongaOperador: 'Roberto M.',
};

/** @deprecated */
export const MOCK_OPERADORES_EM_PAUSA: OperadorEmPausa[] = [
  {
    id: '1',
    funcionarioId: 1,
    nome: 'Ana Costa',
    matricula: '001234',
    tipo: 'refeicao',
    inicio: '12:05',
    previsaoRetorno: '13:20',
    status: 'em-tempo',
    tempoRestante: '15 min',
    pausaId: 'pausa-1',
  },
];

/** @deprecated */
export const MOCK_CHART_SEMANAL: ChartDia[] = [];

/** @deprecated */
export const MOCK_REGISTROS_DETALHADOS: PausaRegistroDetalhe[] = [];

/** @deprecated */
export const MOCK_RELATORIO_FOOTER_KPI: RelatorioFooterKpi = {
  totalPausas: 0,
  mediaPausaPorTurno: '0 min',
  pausasTermicasMinutos: 0,
  pausasRefeicaoMinutos: 0,
};

/** @deprecated */
export const MOCK_RELATORIOS_PRONTOS: RelatorioPronto[] = [];

/** @deprecated */
export const MOCK_REGISTRO_OPERADORES: Record<string, RegistroOperador> = {};
