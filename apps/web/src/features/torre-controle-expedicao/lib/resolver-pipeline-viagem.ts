import type {
  HorarioProcesso,
  ProcessoOperacional,
  ProcessoStatus,
  TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type EtapaPipelineDetalhe =
  | ProcessoOperacional
  | 'viagem_inicio'
  | 'viagem_fim';

export type PipelineDetalheEtapaProcesso = {
  key: ProcessoOperacional;
  label: string;
  modo: 'processo';
  status: ProcessoStatus;
  horario: HorarioProcesso;
};

export type PipelineDetalheEtapaHorario = {
  key: 'viagem_inicio' | 'viagem_fim';
  label: string;
  modo: 'horario';
  horario: string | null;
};

export type PipelineDetalheEtapa =
  | PipelineDetalheEtapaProcesso
  | PipelineDetalheEtapaHorario;

const ETAPAS_WMS: ReadonlyArray<{ key: ProcessoOperacional; label: string }> = [
  { key: 'separacao', label: 'Separação' },
  { key: 'conferencia', label: 'Conferência' },
  { key: 'carregamento', label: 'Carregamento' },
];

const ETAPAS_VIAGEM: ReadonlyArray<{
  key: 'viagem_inicio' | 'viagem_fim';
  label: string;
  resolverHorario: (transporte: TransporteRisco) => string | null | undefined;
}> = [
  {
    key: 'viagem_inicio',
    label: 'Início viagem',
    resolverHorario: (transporte) => transporte.viagemInicioEm,
  },
  {
    key: 'viagem_fim',
    label: 'Fim viagem',
    resolverHorario: (transporte) => transporte.viagemFimEm,
  },
];

function normalizarHorarioViagem(valor: string | null | undefined): string | null {
  if (!valor || valor === '—') {
    return null;
  }

  return valor;
}

function isProcessoStatus(valor: unknown): valor is ProcessoStatus {
  return valor === 'pendente' || valor === 'em_andamento' || valor === 'concluido';
}

export function isEtapaHorario(
  etapa: PipelineDetalheEtapa,
): etapa is PipelineDetalheEtapaHorario {
  return etapa.modo === 'horario';
}

export function montarPipelineDetalheTransporte(
  transporte: TransporteRisco,
): PipelineDetalheEtapa[] {
  const etapasWms: PipelineDetalheEtapaProcesso[] = ETAPAS_WMS.map(({ key, label }) => ({
    key,
    label,
    modo: 'processo',
    status: isProcessoStatus(transporte.statusProcessos?.[key])
      ? transporte.statusProcessos[key]
      : 'pendente',
    horario: transporte.horariosProcessos?.[key] ?? { inicio: null, fim: null },
  }));

  const etapasViagem: PipelineDetalheEtapaHorario[] = ETAPAS_VIAGEM.map(
    ({ key, label, resolverHorario }) => ({
      key,
      label,
      modo: 'horario',
      horario: normalizarHorarioViagem(resolverHorario(transporte)),
    }),
  );

  return [...etapasWms, ...etapasViagem];
}
