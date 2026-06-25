import type { GerarMapasResponse } from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { TipoMapaImpressaoProcesso } from '../../dtos/expedicao/imprimir-mapas.dto.js';
import type { MapaLoteResumo } from '../../dtos/expedicao/salvar-mapas.dto.js';
import type { MapaLoteRecord } from '../../../domain/repositories/expedicao/mapa-lote.repository.js';

export type GrupoImpressaoMapa = {
  grupo: GerarMapasResponse['grupos'][number];
  sequencia: number;
  transporteId: string;
  paginaTransporte: number;
  totalPaginasTransporte: number;
};

export function resolverGruposPayloadPorTipo(
  payload: GerarMapasResponse,
  tipoMapa: TipoMapaImpressaoProcesso,
): GerarMapasResponse['grupos'] {
  if (tipoMapa === 'conferencia') {
    return payload.conferencia?.grupos ?? [];
  }

  return payload.separacao?.grupos ?? payload.grupos;
}

function montarMapaRotaTransporteId(
  lotes: MapaLoteRecord[],
  transporteIdsSet: Set<string>,
): Map<string, string> {
  const rotaTransporteId = new Map<string, string>();

  for (const lote of lotes) {
    const resumo = lote.resumo as MapaLoteResumo;

    for (const transporte of resumo.transportes) {
      if (!transporteIdsSet.has(transporte.transporteId)) {
        continue;
      }

      rotaTransporteId.set(transporte.rota, transporte.transporteId);
    }
  }

  return rotaTransporteId;
}

function resolverTransporteIdGrupo(
  rotaCabecalho: string,
  rotaTransporteId: Map<string, string>,
): string | null {
  return rotaTransporteId.get(rotaCabecalho) ?? null;
}

function aplicarPaginacaoPorTransporte(
  grupos: Omit<GrupoImpressaoMapa, 'paginaTransporte' | 'totalPaginasTransporte'>[],
): GrupoImpressaoMapa[] {
  const totalPorTransporte = new Map<string, number>();

  for (const grupo of grupos) {
    totalPorTransporte.set(
      grupo.transporteId,
      (totalPorTransporte.get(grupo.transporteId) ?? 0) + 1,
    );
  }

  const paginaAtualPorTransporte = new Map<string, number>();

  return grupos.map((grupo) => {
    const paginaTransporte =
      (paginaAtualPorTransporte.get(grupo.transporteId) ?? 0) + 1;
    paginaAtualPorTransporte.set(grupo.transporteId, paginaTransporte);

    return {
      ...grupo,
      paginaTransporte,
      totalPaginasTransporte: totalPorTransporte.get(grupo.transporteId) ?? 1,
    };
  });
}

export function resolverGruposImpressaoMapa(input: {
  lotes: MapaLoteRecord[];
  transporteIds: string[];
  tipoMapa: TipoMapaImpressaoProcesso;
}): GrupoImpressaoMapa[] {
  const transporteIdsSet = new Set(input.transporteIds);
  const rotaTransporteId = montarMapaRotaTransporteId(
    input.lotes,
    transporteIdsSet,
  );

  const gruposPorId = new Map<string, GerarMapasResponse['grupos'][number]>();
  const ordemGrupoIds: string[] = [];

  for (const lote of input.lotes) {
    const payload = lote.payload as GerarMapasResponse;
    const gruposTipo = resolverGruposPayloadPorTipo(payload, input.tipoMapa);

    for (const grupo of gruposTipo) {
      const transporteId = resolverTransporteIdGrupo(
        grupo.cabecalho.transporte,
        rotaTransporteId,
      );

      if (!transporteId || !transporteIdsSet.has(transporteId)) {
        continue;
      }

      const grupoId = grupo.id;

      if (!gruposPorId.has(grupoId)) {
        gruposPorId.set(grupoId, grupo);
        ordemGrupoIds.push(grupoId);
      }
    }
  }

  const gruposBase = ordemGrupoIds
    .map((grupoId, index) => {
      const grupo = gruposPorId.get(grupoId);
      const transporteId = grupo
        ? resolverTransporteIdGrupo(grupo.cabecalho.transporte, rotaTransporteId)
        : null;

      if (!grupo || !transporteId) {
        return null;
      }

      return {
        grupo,
        sequencia: index + 1,
        transporteId,
      };
    })
    .filter(
      (
        entry,
      ): entry is Omit<
        GrupoImpressaoMapa,
        'paginaTransporte' | 'totalPaginasTransporte'
      > => entry !== null,
    );

  return aplicarPaginacaoPorTransporte(gruposBase);
}
