import { Inject, Injectable } from '@nestjs/common';

import type {
  ConferirItemInput,
  IniciarRecebimentoInput,
  RecebimentoSituacao,
} from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  AddItemRecebimentoOptions,
  CreateDivergenciaInput,
  IRecebimentoRepository,
  ListRecebimentosFilter,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { addItemRecebimentoDb } from './add-item-recebimento.drizzle.js';
import { findPesagemByEtiquetaDb } from './find-pesagem-by-etiqueta.drizzle.js';
import { removeItemConferenciaByIdDb } from './remove-item-conferencia-by-id.drizzle.js';
import { removeItensConferenciaByUnitizadorDb } from './remove-itens-conferencia-by-unitizador.drizzle.js';
import { removeItensConferenciaProdutoDb } from './remove-itens-conferencia-produto.drizzle.js';
import { removePesagemRecebimentoDb } from './remove-pesagem-recebimento.drizzle.js';
import { clearDivergenciasDb } from './clear-divergencias.drizzle.js';
import { createDivergenciaDb } from './create-divergencia.drizzle.js';
import { createRecebimentoDb } from './create-recebimento.drizzle.js';
import { findDivergenciasDb } from './find-divergencias.drizzle.js';
import { findItensRecebimentoDb } from './find-itens-recebimento.drizzle.js';
import {
  findRecebimentoByIdDb,
  findRecebimentoByPreRecebimentoIdDb,
} from './find-recebimento.drizzle.js';
import { listRecebimentosDb } from './list-recebimentos.drizzle.js';
import { updateRecebimentoStatusDb } from './update-recebimento-status.drizzle.js';

@Injectable()
export class RecebimentoService implements IRecebimentoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(
    data: IniciarRecebimentoInput,
    userId: number | null,
    modoUnitizacao: string,
  ) {
    return createRecebimentoDb(this.db, data, userId, modoUnitizacao);
  }

  findById(id: string) {
    return findRecebimentoByIdDb(this.db, id);
  }

  findByPreRecebimentoId(preRecebimentoId: string) {
    return findRecebimentoByPreRecebimentoIdDb(this.db, preRecebimentoId);
  }

  list(filter: ListRecebimentosFilter) {
    return listRecebimentosDb(this.db, filter);
  }

  addItem(
    recebimentoId: string,
    unidadeId: string,
    data: ConferirItemInput,
    options?: AddItemRecebimentoOptions,
  ) {
    return addItemRecebimentoDb(this.db, recebimentoId, unidadeId, data, options);
  }

  findPesagemByEtiqueta(unidadeId: string, etiquetaCodigo: string) {
    return findPesagemByEtiquetaDb(this.db, unidadeId, etiquetaCodigo);
  }

  removePesagem(recebimentoId: string, pesagemId: string) {
    return removePesagemRecebimentoDb(this.db, recebimentoId, pesagemId);
  }

  removeItemsByProduto(recebimentoId: string, produtoId: string) {
    return removeItensConferenciaProdutoDb(this.db, recebimentoId, produtoId);
  }

  removeItemConferenciaById(recebimentoId: string, itemId: string) {
    return removeItemConferenciaByIdDb(this.db, recebimentoId, itemId);
  }

  removeItensConferenciaByUnitizador(
    recebimentoId: string,
    unitizadorId: string,
    produtoId?: string,
  ) {
    return removeItensConferenciaByUnitizadorDb(
      this.db,
      recebimentoId,
      unitizadorId,
      produtoId,
    );
  }

  findItemsByRecebimento(recebimentoId: string) {
    return findItensRecebimentoDb(this.db, recebimentoId);
  }

  createDivergencia(data: CreateDivergenciaInput) {
    return createDivergenciaDb(this.db, data);
  }

  findDivergencias(recebimentoId: string) {
    return findDivergenciasDb(this.db, recebimentoId);
  }

  clearDivergencias(recebimentoId: string) {
    return clearDivergenciasDb(this.db, recebimentoId);
  }

  updateStatus(
    id: string,
    situacao: RecebimentoSituacao,
    dataFim?: Date | null,
    quantidadePaletes?: number | null,
    teveSobreposicaoCarga?: boolean,
  ) {
    return updateRecebimentoStatusDb(
      this.db,
      id,
      situacao,
      dataFim,
      quantidadePaletes,
      teveSobreposicaoCarga,
    );
  }
}
