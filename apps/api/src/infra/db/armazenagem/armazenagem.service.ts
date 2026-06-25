import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateDemandaArmazenagemInput,
  CreateUnitizadorInput,
} from '../../../domain/model/armazenagem/armazenagem.model.js';
import type {
  DemandaArmazenagemStatus,
  ItemArmazenagemStatus,
  UnitizadorStatus,
} from '../../../domain/model/armazenagem/armazenagem.model.js';
import type {
  IArmazenagemRepository,
  ListDemandasArmazenagemFilter,
  ListEnderecosSugeridosReservadosFilter,
  UpdateDemandaArmazenagemExtra,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import type { PoliticaArmazenagem } from '@lilog/contracts';

import {
  criarDemandaArmazenagemDb,
  findDemandaByIdDb,
  findDemandaByRecebimentoIdDb,
  findItemArmazenagemByIdDb,
  listDemandasArmazenagemDb,
  updateStatusDemandaDb,
  updateItemQuantidadeArmazenagemDb,
  updateStatusItemArmazenagemDb,
} from './demanda-armazenagem.drizzle.js';
import {
  getPoliticaArmazenagemDb,
  upsertPoliticaArmazenagemDb,
} from './politica-armazenagem.drizzle.js';
import { listEnderecosSugeridosReservadosArmazenagemDb } from './list-enderecos-sugeridos-reservados-armazenagem.drizzle.js';
import { updateEnderecoSugeridoItemArmazenagemDb } from './update-endereco-sugerido-item-armazenagem.drizzle.js';
import {
  criarUnitizadorDb,
  findUnitizadorByCodigoDb,
  findUnitizadorByIdDb,
  updateUnitizadorStatusDb,
} from './create-unitizador.drizzle.js';
import { resolveDocumentoRefByRecebimentoIdDb } from './resolve-documento-ref-recebimento.drizzle.js';

@Injectable()
export class ArmazenagemService implements IArmazenagemRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  criarDemanda(input: CreateDemandaArmazenagemInput) {
    return criarDemandaArmazenagemDb(this.db, input);
  }

  findDemandaByRecebimentoId(recebimentoId: string) {
    return findDemandaByRecebimentoIdDb(this.db, recebimentoId);
  }

  findDemandaById(id: string) {
    return findDemandaByIdDb(this.db, id);
  }

  findItemById(id: string) {
    return findItemArmazenagemByIdDb(this.db, id);
  }

  listDemandas(filter: ListDemandasArmazenagemFilter) {
    return listDemandasArmazenagemDb(this.db, filter);
  }

  updateStatusDemanda(
    id: string,
    status: DemandaArmazenagemStatus,
    extra?: UpdateDemandaArmazenagemExtra,
  ) {
    return updateStatusDemandaDb(this.db, id, status, extra);
  }

  updateStatusItem(
    id: string,
    status: ItemArmazenagemStatus,
    enderecoConfirmadoId?: string,
    unitizadorId?: string,
    quantidade?: number,
  ) {
    return updateStatusItemArmazenagemDb(
      this.db,
      id,
      status,
      enderecoConfirmadoId,
      unitizadorId,
      quantidade,
    );
  }

  updateItemQuantidade(id: string, quantidade: number) {
    return updateItemQuantidadeArmazenagemDb(this.db, id, quantidade);
  }

  updateEnderecoSugeridoItem(id: string, enderecoSugeridoId: string) {
    return updateEnderecoSugeridoItemArmazenagemDb(
      this.db,
      id,
      enderecoSugeridoId,
    );
  }

  listEnderecosSugeridosReservados(
    filter: ListEnderecosSugeridosReservadosFilter,
  ) {
    return listEnderecosSugeridosReservadosArmazenagemDb(this.db, filter);
  }

  criarUnitizador(input: CreateUnitizadorInput) {
    return criarUnitizadorDb(this.db, input);
  }

  findUnitizadorByCodigo(unidadeId: string, codigo: string) {
    return findUnitizadorByCodigoDb(this.db, unidadeId, codigo);
  }

  findUnitizadorById(id: string) {
    return findUnitizadorByIdDb(this.db, id);
  }

  updateUnitizadorStatus(
    id: string,
    status: UnitizadorStatus,
    extra?: { enderecoAtualId?: string; recebimentoId?: string },
  ) {
    return updateUnitizadorStatusDb(this.db, id, status, extra);
  }

  getPoliticaArmazenagem(unidadeId: string): Promise<PoliticaArmazenagem> {
    return getPoliticaArmazenagemDb(this.db, unidadeId);
  }

  upsertPoliticaArmazenagem(
    unidadeId: string,
    data: PoliticaArmazenagem,
  ): Promise<PoliticaArmazenagem> {
    return upsertPoliticaArmazenagemDb(this.db, unidadeId, data);
  }

  resolveDocumentoRefByRecebimentoId(recebimentoId: string) {
    return resolveDocumentoRefByRecebimentoIdDb(this.db, recebimentoId);
  }
}
