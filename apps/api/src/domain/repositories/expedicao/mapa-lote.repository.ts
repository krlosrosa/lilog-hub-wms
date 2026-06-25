import type {
  GerarMapasConfigInput,
  GerarMapasResponse,
} from '../../../application/dtos/expedicao/gerar-mapas.dto.js';
import type { MapaLoteResumo } from '../../../application/dtos/expedicao/salvar-mapas.dto.js';

export const MAPA_LOTE_REPOSITORY = 'IMapaLoteRepository';

export type TransporteMapaMeta = {
  id: string;
  rota: string;
  placa: string | null;
  mapaGeradoEm: Date | null;
};

export type InsertMapaLoteInput = {
  unidadeId: string;
  transporteIds: string[];
  config: GerarMapasConfigInput;
  payload: GerarMapasResponse;
  resumo: MapaLoteResumo;
  configuracaoImpressaoId?: string | null;
  templatesHtml?: unknown | null;
  criadoPor: number | null;
  transportesPorRota: Map<string, string>;
};

export type MapaLoteRecord = {
  id: string;
  unidadeId: string;
  config: GerarMapasConfigInput;
  payload: GerarMapasResponse;
  resumo: MapaLoteResumo;
  configuracaoImpressaoId: string | null;
  templatesHtml: unknown | null;
  criadoPor: number | null;
  createdAt: Date;
};

export type MapaLoteListItem = {
  id: string;
  unidadeId: string;
  resumo: MapaLoteResumo;
  configuracaoImpressaoId: string | null;
  criadoPor: number | null;
  createdAt: Date;
  transporteIds: string[];
};

export type ExcluirMapaLoteResult = {
  loteId: string;
  transportesAfetados: number;
};

export interface IMapaLoteRepository {
  inserir(input: InsertMapaLoteInput): Promise<MapaLoteRecord>;
  listarPorTransporteIds(
    unidadeId: string,
    transporteIds: string[],
  ): Promise<MapaLoteListItem[]>;
  obterPorId(id: string, unidadeId: string): Promise<MapaLoteRecord | null>;
  excluir(
    id: string,
    unidadeId: string,
  ): Promise<ExcluirMapaLoteResult | null>;
}
