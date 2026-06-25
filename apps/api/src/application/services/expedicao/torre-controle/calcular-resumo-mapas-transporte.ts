import type { MapaOperacionalRow } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';

export type ResumoMapasTransporte = {
  mapasTotal: number;
  mapasConcluidos: number;
};

export function calcularResumoMapasTransporte(
  mapasOperacionais: ReadonlyArray<MapaOperacionalRow>,
  transporteId: string,
): ResumoMapasTransporte {
  const mapas = mapasOperacionais.filter(
    (mapa) => mapa.transporteId === transporteId,
  );

  return {
    mapasTotal: mapas.length,
    mapasConcluidos: mapas.filter((mapa) => mapa.finalizadoEm != null).length,
  };
}

export function transporteSeparacaoNaoIniciada(
  mapasOperacionais: ReadonlyArray<MapaOperacionalRow>,
  transporteId: string,
): boolean {
  const mapasSeparacao = mapasOperacionais.filter(
    (mapa) =>
      mapa.transporteId === transporteId && mapa.processo === 'separacao',
  );

  if (mapasSeparacao.length === 0) {
    return true;
  }

  return mapasSeparacao.every(
    (mapa) => mapa.iniciadoEm == null && mapa.finalizadoEm == null,
  );
}
