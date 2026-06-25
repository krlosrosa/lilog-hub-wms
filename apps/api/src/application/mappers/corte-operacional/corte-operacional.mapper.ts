import type {
  CorteDetalheRecord,
  CorteItemRecord,
  CorteRecord,
  MapaGrupoCorteRecord,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';
import type {
  CorteDetalheResponseDto,
  CorteResponseDto,
  ListCortesResponseDto,
  MapaGrupoCorteResponseDto,
} from '../../dtos/corte-operacional/corte-operacional.dto.js';

export function mapCorteItemToDto(item: CorteItemRecord) {
  return {
    id: item.id,
    mapaGrupoItemId: item.mapaGrupoItemId,
    sku: item.sku,
    descricao: item.descricao,
    remessa: item.remessa,
    cliente: item.cliente,
    lote: item.lote,
    quantidadeMapa: item.quantidadeMapa,
    quantidadeCorte: item.quantidadeCorte,
    unidadeMedida: item.unidadeMedida,
    pesoKg: item.pesoKg,
  };
}

export function mapCorteToDto(corte: CorteRecord): CorteResponseDto {
  return {
    id: corte.id,
    unidadeId: corte.unidadeId,
    codigo: corte.codigo,
    mapaGrupoId: corte.mapaGrupoId,
    mapaGrupoMicroUuid: corte.mapaGrupoMicroUuid,
    mapaGrupoTitulo: corte.mapaGrupoTitulo,
    transporteId: corte.transporteId,
    rota: corte.rota,
    doca: corte.doca,
    status: corte.status,
    motivo: corte.motivo,
    observacao: corte.observacao,
    totalVolumes: corte.totalVolumes,
    pesoTotalKg: corte.pesoTotalKg,
    solicitadoPor: corte.solicitadoPor,
    solicitadoPorNome: corte.solicitadoPorNome,
    solicitadoEm: corte.solicitadoEm.toISOString(),
    realizadoPor: corte.realizadoPor,
    realizadoPorNome: corte.realizadoPorNome,
    realizadoEm: corte.realizadoEm?.toISOString() ?? null,
    canceladoPor: corte.canceladoPor,
    canceladoPorNome: corte.canceladoPorNome,
    canceladoEm: corte.canceladoEm?.toISOString() ?? null,
    motivoCancelamento: corte.motivoCancelamento,
    createdAt: corte.createdAt.toISOString(),
    updatedAt: corte.updatedAt.toISOString(),
  };
}

export function mapCorteDetalheToDto(
  corte: CorteDetalheRecord,
): CorteDetalheResponseDto {
  return {
    ...mapCorteToDto(corte),
    itens: corte.itens.map(mapCorteItemToDto),
  };
}

export function mapListCortesToDto(input: {
  items: CorteRecord[];
  total: number;
  page: number;
  limit: number;
}): ListCortesResponseDto {
  return {
    items: input.items.map(mapCorteToDto),
    total: input.total,
    page: input.page,
    limit: input.limit,
  };
}

export function mapMapaGrupoCorteToDto(
  mapa: MapaGrupoCorteRecord,
): MapaGrupoCorteResponseDto {
  return {
    id: mapa.id,
    microUuid: mapa.microUuid,
    titulo: mapa.titulo,
    subtitulo: mapa.subtitulo,
    transporteId: mapa.transporteId,
    transporteRota: mapa.transporteRota,
    totalItens: mapa.totalItens,
    pesoTotalKg: mapa.pesoTotalKg,
    itens: mapa.itens.map((item) => ({
      id: item.id,
      sku: item.sku,
      descricao: item.descricao,
      remessa: item.remessa,
      cliente: item.cliente,
      lote: item.lote,
      quantidade: item.quantidade,
      unidadeMedida: item.unidadeMedida,
      peso: item.peso,
    })),
  };
}
