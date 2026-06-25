import type { MapaGrupoProcessoRead } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import { formatarDataHoraPtBr } from './formatar-data-hora-pt-br.js';

const ORDEM_PROCESSOS: MapaGrupoProcessoRead[] = [
  'separacao',
  'conferencia',
  'carregamento',
];

export type MapaGrupoHorarioInput = {
  transporteId: string;
  processo: MapaGrupoProcessoRead;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
};

export type HorarioProcesso = {
  inicio: string | null;
  fim: string | null;
};

export type HorariosProcessos = Record<MapaGrupoProcessoRead, HorarioProcesso>;

function formatarHorarioProcesso(date: Date): string {
  return formatarDataHoraPtBr(date);
}

function resolverHorarioProcesso(
  mapasProcesso: MapaGrupoHorarioInput[],
): HorarioProcesso {
  if (mapasProcesso.length === 0) {
    return { inicio: null, fim: null };
  }

  const iniciados = mapasProcesso.filter((m) => m.iniciadoEm != null);
  const inicio =
    iniciados.length > 0
      ? formatarHorarioProcesso(
          new Date(
            Math.min(...iniciados.map((m) => m.iniciadoEm!.getTime())),
          ),
        )
      : null;

  const todosFinalizados = mapasProcesso.every((m) => m.finalizadoEm != null);
  const fim = todosFinalizados
    ? formatarHorarioProcesso(
        new Date(
          Math.max(...mapasProcesso.map((m) => m.finalizadoEm!.getTime())),
        ),
      )
    : null;

  return { inicio, fim };
}

export function resolverHorariosProcessos(
  mapas: MapaGrupoHorarioInput[],
): HorariosProcessos {
  return ORDEM_PROCESSOS.reduce<HorariosProcessos>((acc, processo) => {
    acc[processo] = resolverHorarioProcesso(
      mapas.filter((m) => m.processo === processo),
    );
    return acc;
  }, {} as HorariosProcessos);
}

export function resolverHorariosProcessosPorTransporte(
  mapas: MapaGrupoHorarioInput[],
): Map<string, HorariosProcessos> {
  const porTransporte = new Map<string, MapaGrupoHorarioInput[]>();

  for (const mapa of mapas) {
    const lista = porTransporte.get(mapa.transporteId) ?? [];
    lista.push(mapa);
    porTransporte.set(mapa.transporteId, lista);
  }

  return new Map(
    [...porTransporte.entries()].map(([transporteId, mapasTransporte]) => [
      transporteId,
      resolverHorariosProcessos(mapasTransporte),
    ]),
  );
}
