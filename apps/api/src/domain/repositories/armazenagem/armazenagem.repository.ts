import type { PoliticaArmazenagem } from '@lilog/contracts';

import type {
  CreateDemandaArmazenagemInput,
  CreateUnitizadorInput,
  DemandaArmazenagemStatus,
  ItemArmazenagemStatus,
  UnitizadorStatus,
} from '../../model/armazenagem/armazenagem.model.js';

export const ARMAZENAGEM_REPOSITORY = 'IArmazenagemRepository';

export type UnitizadorRecord = {
  id: string;
  unidadeId: string;
  codigo: string;
  tipo: CreateUnitizadorInput['tipo'];
  origem: CreateUnitizadorInput['origem'];
  status: UnitizadorStatus;
  recebimentoId: string | null;
  enderecoAtualId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ItemArmazenagemRecord = {
  id: string;
  demandaId: string;
  unitizadorId: string | null;
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  enderecoSugeridoId: string | null;
  enderecoConfirmadoId: string | null;
  status: ItemArmazenagemStatus;
  produtoSku: string | null;
  produtoNome: string | null;
  enderecoSugeridoLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaArmazenagemRecord = {
  id: string;
  unidadeId: string;
  recebimentoId: string;
  modoUnitizacao: string;
  status: DemandaArmazenagemStatus;
  responsavelId: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaArmazenagemWithItens = DemandaArmazenagemRecord & {
  itens: ItemArmazenagemRecord[];
};

export type ListDemandasArmazenagemFilter = {
  page?: number;
  limit?: number;
  unidadeId: string;
  status?: DemandaArmazenagemStatus;
  responsavelId?: number;
};

export type ListDemandasArmazenagemResult = {
  items: DemandaArmazenagemRecord[];
  total: number;
  page: number;
  limit: number;
};

export type UpdateDemandaArmazenagemExtra = {
  responsavelId?: number;
  startedAt?: Date;
  finishedAt?: Date;
};

export type ListEnderecosSugeridosReservadosFilter = {
  unidadeId: string;
  excludeItemId?: string;
};

export interface IArmazenagemRepository {
  criarDemanda(
    input: CreateDemandaArmazenagemInput,
  ): Promise<DemandaArmazenagemWithItens>;
  findDemandaByRecebimentoId(
    recebimentoId: string,
  ): Promise<DemandaArmazenagemWithItens | null>;
  findDemandaById(id: string): Promise<DemandaArmazenagemWithItens | null>;
  findItemById(id: string): Promise<ItemArmazenagemRecord | null>;
  listDemandas(
    filter: ListDemandasArmazenagemFilter,
  ): Promise<ListDemandasArmazenagemResult>;
  updateStatusDemanda(
    id: string,
    status: DemandaArmazenagemStatus,
    extra?: UpdateDemandaArmazenagemExtra,
  ): Promise<DemandaArmazenagemRecord | null>;
  updateStatusItem(
    id: string,
    status: ItemArmazenagemStatus,
    enderecoConfirmadoId?: string,
    unitizadorId?: string,
    quantidade?: number,
  ): Promise<ItemArmazenagemRecord | null>;
  updateItemQuantidade(
    id: string,
    quantidade: number,
  ): Promise<ItemArmazenagemRecord | null>;
  updateEnderecoSugeridoItem(
    id: string,
    enderecoSugeridoId: string,
  ): Promise<ItemArmazenagemRecord | null>;
  listEnderecosSugeridosReservados(
    filter: ListEnderecosSugeridosReservadosFilter,
  ): Promise<string[]>;
  criarUnitizador(input: CreateUnitizadorInput): Promise<UnitizadorRecord>;
  findUnitizadorByCodigo(
    unidadeId: string,
    codigo: string,
  ): Promise<UnitizadorRecord | null>;
  findUnitizadorById(id: string): Promise<UnitizadorRecord | null>;
  updateUnitizadorStatus(
    id: string,
    status: UnitizadorStatus,
    extra?: { enderecoAtualId?: string; recebimentoId?: string },
  ): Promise<UnitizadorRecord | null>;
  getPoliticaArmazenagem(unidadeId: string): Promise<PoliticaArmazenagem>;
  upsertPoliticaArmazenagem(
    unidadeId: string,
    data: PoliticaArmazenagem,
  ): Promise<PoliticaArmazenagem>;
  resolveDocumentoRefByRecebimentoId(
    recebimentoId: string,
  ): Promise<string | null>;
}
