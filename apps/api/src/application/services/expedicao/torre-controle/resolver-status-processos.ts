import type { MapaGrupoProcessoRead } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import type { EtapaOperacional } from './calcular-criticidade-transporte.js';

export type ProcessoStatus = 'pendente' | 'em_andamento' | 'concluido';

export type StatusProcessos = Record<MapaGrupoProcessoRead, ProcessoStatus>;

const ORDEM_PROCESSOS: MapaGrupoProcessoRead[] = [
  'separacao',
  'conferencia',
  'carregamento',
];

export type MapaProcessoStatusInput = {
  processo: MapaGrupoProcessoRead;
  iniciadoEm: Date | null;
};

function resolverStatusProcesso(
  etapaAtual: EtapaOperacional,
  processo: MapaGrupoProcessoRead,
  pendentesNoProcesso: number,
  iniciadosNoProcesso: number,
): ProcessoStatus {
  const idxEtapa =
    etapaAtual === 'finalizado'
      ? ORDEM_PROCESSOS.length
      : ORDEM_PROCESSOS.indexOf(etapaAtual as MapaGrupoProcessoRead);
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
  mapasPendentes: ReadonlyArray<MapaProcessoStatusInput>,
): StatusProcessos {
  const pendentesPorProcesso = new Map<MapaGrupoProcessoRead, number>();
  const iniciadosPorProcesso = new Map<MapaGrupoProcessoRead, number>();

  for (const processo of ORDEM_PROCESSOS) {
    pendentesPorProcesso.set(processo, 0);
    iniciadosPorProcesso.set(processo, 0);
  }

  for (const mapa of mapasPendentes) {
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
