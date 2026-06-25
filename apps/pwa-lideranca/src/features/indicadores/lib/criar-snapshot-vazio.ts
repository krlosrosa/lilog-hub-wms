import type { TorreControleSnapshot } from '@/features/indicadores/lib/torre-controle.schema';

export function criarSnapshotVazio(): TorreControleSnapshot {
  return {
    kpis: [],
    pipeline: [],
    recursos: [],
    timeline: [],
    docas: [],
    transportes: [],
    mapas: [],
    alertas: [],
    turno: {
      sessaoId: '—',
      turnoLabel: 'Turno Expedição',
      inicio: '—',
      fim: '—',
      progressoPercent: 0,
      previsaoConclusao: '—',
      transportesEmRisco: 0,
      latencyMs: 0,
    },
  };
}
