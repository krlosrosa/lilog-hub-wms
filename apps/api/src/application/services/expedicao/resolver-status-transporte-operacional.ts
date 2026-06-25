export type StatusTransportePreOperacional = 'pendente' | 'alocado' | 'parcial';

export type StatusTransporteOperacional =
  | StatusTransportePreOperacional
  | 'em_separacao'
  | 'separado'
  | 'em_conferencia'
  | 'conferido'
  | 'em_carregamento'
  | 'carregado'
  | 'em_viagem'
  | 'viagem_finalizada';

export type ResumoProcessoGrupos = {
  total: number;
  iniciados: number;
  finalizados: number;
};

export type ResumoGruposOperacionaisRecord = {
  separacao: ResumoProcessoGrupos;
  conferencia: ResumoProcessoGrupos;
  carregamento: ResumoProcessoGrupos;
};

const PRE_OPERACIONAL = new Set<StatusTransportePreOperacional>([
  'pendente',
  'alocado',
  'parcial',
]);

const STATUS_VIAGEM_RAVEX = new Set<StatusTransporteOperacional>([
  'em_viagem',
  'viagem_finalizada',
]);

function resolverPorProcesso(
  resumo: ResumoProcessoGrupos,
  emAndamento: StatusTransporteOperacional,
  concluido: StatusTransporteOperacional,
): StatusTransporteOperacional | null {
  if (resumo.total === 0) {
    return null;
  }

  if (resumo.finalizados === resumo.total) {
    return concluido;
  }

  if (resumo.iniciados > 0) {
    return emAndamento;
  }

  return null;
}

export function resolverStatusTransporteOperacional(
  resumo: ResumoGruposOperacionaisRecord,
  statusAtual: StatusTransporteOperacional,
): StatusTransporteOperacional {
  if (STATUS_VIAGEM_RAVEX.has(statusAtual)) {
    return statusAtual;
  }

  const carregamento = resolverPorProcesso(
    resumo.carregamento,
    'em_carregamento',
    'carregado',
  );
  if (carregamento != null) {
    return carregamento;
  }

  const conferencia = resolverPorProcesso(
    resumo.conferencia,
    'em_conferencia',
    'conferido',
  );
  if (conferencia != null) {
    return conferencia;
  }

  const separacao = resolverPorProcesso(
    resumo.separacao,
    'em_separacao',
    'separado',
  );
  if (separacao != null) {
    return separacao;
  }

  if (PRE_OPERACIONAL.has(statusAtual as StatusTransportePreOperacional)) {
    return statusAtual;
  }

  return 'alocado';
}
