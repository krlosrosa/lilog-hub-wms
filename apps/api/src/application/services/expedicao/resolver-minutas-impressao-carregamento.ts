import type { CarregamentoPayload, MinutaCarregamento } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { GerarMapasResponse } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { MapaLoteRecord } from '../../../domain/repositories/expedicao/mapa-lote.repository.js';

export type MinutaImpressaoCarregamento = {
  minuta: MinutaCarregamento;
  sequencia: number;
};

export function resolverCarregamentoPayload(
  payload: GerarMapasResponse,
): CarregamentoPayload | null {
  if (!payload.carregamento) {
    return null;
  }

  return payload.carregamento;
}

export function resolverMinutasImpressaoCarregamento(input: {
  lotes: MapaLoteRecord[];
  transporteIds: string[];
}): MinutaImpressaoCarregamento[] {
  const transporteIdsSet = new Set(input.transporteIds);
  const minutasPorTransporte = new Map<string, MinutaCarregamento>();

  for (const lote of input.lotes) {
    const payload = lote.payload as GerarMapasResponse;
    const carregamento = resolverCarregamentoPayload(payload);

    if (!carregamento) {
      continue;
    }

    for (const minuta of carregamento.minutas) {
      if (!transporteIdsSet.has(minuta.transporteId)) {
        continue;
      }

      if (!minutasPorTransporte.has(minuta.transporteId)) {
        minutasPorTransporte.set(minuta.transporteId, minuta);
      }
    }
  }

  return [...minutasPorTransporte.values()].map((minuta, index) => ({
    minuta,
    sequencia: index + 1,
  }));
}
