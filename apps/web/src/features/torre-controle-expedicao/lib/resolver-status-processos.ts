import type {
  EtapaOperacional,
  ProcessoStatus,
  StatusProcessos,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const ORDEM_PROCESSOS: Array<'separacao' | 'conferencia' | 'carregamento'> = [
  'separacao',
  'conferencia',
  'carregamento',
];

type MapaProcessoStatusInput = {
  processo: 'separacao' | 'conferencia' | 'carregamento';
  iniciadoEm?: Date | string | null;
};

function resolverStatusProcesso(
  etapaAtual: EtapaOperacional,
  processo: 'separacao' | 'conferencia' | 'carregamento',
  pendentesNoProcesso: number,
  iniciadosNoProcesso: number,
): ProcessoStatus {
  const idxEtapa =
    etapaAtual === 'finalizado'
      ? ORDEM_PROCESSOS.length
      : ORDEM_PROCESSOS.indexOf(etapaAtual as 'separacao' | 'conferencia' | 'carregamento');
  const idxProcesso = ORDEM_PROCESSOS.indexOf(processo);

  if (pendentesNoProcesso === 0) {
    if (idxEtapa > idxProcesso || etapaAtual === 'finalizado') {
      return 'concluido';
    }

    if (idxEtapa < idxProcesso) {
      return 'pendente';
    }

    return 'concluido';
  }

  if (iniciadosNoProcesso === 0) {
    return 'pendente';
  }

  return 'em_andamento';
}

export function resolverStatusProcessos(
  etapaAtual: EtapaOperacional,
  mapas: MapaProcessoStatusInput[],
): StatusProcessos {
  const pendentesPorProcesso = new Map<
    'separacao' | 'conferencia' | 'carregamento',
    number
  >();
  const iniciadosPorProcesso = new Map<
    'separacao' | 'conferencia' | 'carregamento',
    number
  >();

  for (const processo of ORDEM_PROCESSOS) {
    pendentesPorProcesso.set(processo, 0);
    iniciadosPorProcesso.set(processo, 0);
  }

  for (const mapa of mapas) {
    pendentesPorProcesso.set(
      mapa.processo,
      (pendentesPorProcesso.get(mapa.processo) ?? 0) + 1,
    );

    if (mapa.iniciadoEm != null) {
      iniciadosPorProcesso.set(
        mapa.processo,
        (iniciadosPorProcesso.get(mapa.processo) ?? 0) + 1,
      );
    }
  }

  return {
    separacao: resolverStatusProcesso(
      etapaAtual,
      'separacao',
      pendentesPorProcesso.get('separacao') ?? 0,
      iniciadosPorProcesso.get('separacao') ?? 0,
    ),
    conferencia: resolverStatusProcesso(
      etapaAtual,
      'conferencia',
      pendentesPorProcesso.get('conferencia') ?? 0,
      iniciadosPorProcesso.get('conferencia') ?? 0,
    ),
    carregamento: resolverStatusProcesso(
      etapaAtual,
      'carregamento',
      pendentesPorProcesso.get('carregamento') ?? 0,
      iniciadosPorProcesso.get('carregamento') ?? 0,
    ),
  };
}
