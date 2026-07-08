import type {
  FiltroRapidoTransporte,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

export function transporteTemPlacaAlocada(transporte: TransporteGrupo): boolean {
  return (
    transporte.status === 'ALOCADO' ||
    Boolean(transporte.veiculoAlocado?.placa?.trim())
  );
}

export function transporteTemMapaSalvo(transporte: TransporteGrupo): boolean {
  return transporte.ultimoMapaLoteId != null;
}

export function filtrarTransportesExpedicao(
  transportes: TransporteGrupo[],
  filtro: FiltroRapidoTransporte,
): TransporteGrupo[] {
  switch (filtro) {
    case 'sem_placa':
      return transportes.filter((item) => !transporteTemPlacaAlocada(item));
    case 'alocados':
      return transportes.filter(transporteTemPlacaAlocada);
    case 'sem_mapa':
      return transportes.filter((item) => !transporteTemMapaSalvo(item));
    case 'com_mapa':
      return transportes.filter(transporteTemMapaSalvo);
    default:
      return transportes;
  }
}

export function contarTransportesPorFiltroRapido(
  transportes: TransporteGrupo[],
): Record<FiltroRapidoTransporte, number> {
  return {
    todos: transportes.length,
    sem_placa: transportes.filter((item) => !transporteTemPlacaAlocada(item))
      .length,
    alocados: transportes.filter(transporteTemPlacaAlocada).length,
    sem_mapa: transportes.filter((item) => !transporteTemMapaSalvo(item)).length,
    com_mapa: transportes.filter(transporteTemMapaSalvo).length,
  };
}
