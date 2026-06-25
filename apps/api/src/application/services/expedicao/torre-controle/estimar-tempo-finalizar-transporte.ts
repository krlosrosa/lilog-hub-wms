import type { VwMapasPendentesRow } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';

export function estimarTempoFinalizarTransporteSeg(
  transporteId: string,
  mapasPendentes: VwMapasPendentesRow[],
): number {
  const mapasDoTransporte = mapasPendentes.filter(
    (m) => m.transporteId === transporteId,
  );

  if (mapasDoTransporte.length === 0) {
    return 0;
  }

  return mapasDoTransporte.reduce(
    (acc, mapa) => acc + Math.max(0, mapa.tempoEsperadoSeg),
    0,
  );
}

export function estimarTempoFinalizarTransporteMin(
  transporteId: string,
  mapasPendentes: VwMapasPendentesRow[],
): number {
  return Math.ceil(
    estimarTempoFinalizarTransporteSeg(transporteId, mapasPendentes) / 60,
  );
}
