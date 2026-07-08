import type { PoliticaArmazenagem } from '@lilog/contracts';

import type {
  CreateDemandaArmazenagemInput,
  CreateUnitizadorInput,
  DemandaArmazenagemStatus,
  ItemArmazenagemStatus,
  TarefaArmazenagemStatus,
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
  tarefaId: string | null;
  unitizadorId: string | null;
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  statusSaldo: 'liberado' | 'bloqueado';
  enderecoSugeridoId: string | null;
  enderecoConfirmadoId: string | null;
  status: ItemArmazenagemStatus;
  produtoSku: string | null;
  produtoNome: string | null;
  unitizadorCodigo: string | null;
  enderecoSugeridoLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TarefaArmazenagemRecord = {
  id: string;
  demandaId: string;
  unitizadorId: string | null;
  unitizadorCodigo: string | null;
  sequencia: number;
  status: TarefaArmazenagemStatus;
  enderecoSugeridoId: string | null;
  enderecoConfirmadoId: string | null;
  enderecoSugeridoLabel: string | null;
  responsavelId: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  itens: ItemArmazenagemRecord[];
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
  validadoPor: number | null;
  validadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaArmazenagemWithItens = DemandaArmazenagemRecord & {
  itens: ItemArmazenagemRecord[];
  tarefas?: TarefaArmazenagemRecord[];
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
  validadoPor?: number;
  validadoEm?: Date;
};

export type ListEnderecosSugeridosReservadosFilter = {
  unidadeId: string;
  excludeItemId?: string;
  excludeTarefaId?: string;
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
  findTarefaById(id: string): Promise<TarefaArmazenagemRecord | null>;
  findTarefaByUnitizadorCodigo(
    unidadeId: string,
    codigo: string,
  ): Promise<TarefaArmazenagemRecord | null>;
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
  updateEnderecoSugeridoTarefa(
    id: string,
    enderecoSugeridoId: string,
  ): Promise<TarefaArmazenagemRecord | null>;
  updateStatusTarefa(
    id: string,
    status: TarefaArmazenagemStatus,
    extra?: {
      responsavelId?: number;
      startedAt?: Date;
      finishedAt?: Date;
      enderecoConfirmadoId?: string;
    },
  ): Promise<TarefaArmazenagemRecord | null>;
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
