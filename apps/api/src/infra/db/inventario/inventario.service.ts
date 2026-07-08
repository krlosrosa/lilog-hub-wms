import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateDemandaContagemInput,
  CreateInventarioInput,
  DemandaFiltros,
  SubmitContagemAvariaInput,
  SubmitContagemCegaInput,
} from '../../../domain/model/inventario/inventario.model.js';
import type {
  CreateDivergenciaInput,
  CreateDivergenciaRecontagemInput,
  IInventarioRepository,
  InventarioRecord,
  ListInventariosFilter,
  UpdateDivergenciaContagemInput,
  UpdateDivergenciaStatusInput,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  createDemandaDb,
  deleteDemandaDb,
  findDemandaByIdDb,
  findDemandaEnderecoByIdDb,
  listDemandaEnderecosDb,
  listDemandasByInventarioDb,
  listAllContagemDemandasDb,
  listDemandasForOperatorDb,
  markDemandaEnderecoEmAndamentoDb,
  activateDemandaContagemDb,
  concluirDemandaContagemSeCompletaDb,
} from './demanda-crud.drizzle.js';
import {
  submitContagemAvariaDb,
  submitContagemCegaDb,
  submitContagemValidacaoDb,
  type SubmitContagemValidacaoDbInput,
} from './contagem-submit.drizzle.js';
import {
  createDivergenciasDb,
  findDivergenciaByIdDb,
  listDivergenciasByInventarioDb,
  updateDivergenciaContagemDb,
  updateDivergenciaStatusDb,
} from './inventario-divergencias-crud.drizzle.js';
import {
  listContagensValidacaoParaReconciliacaoDb,
  listInventarioDivergenciasDb,
} from './inventario-divergencias.drizzle.js';
import {
  createDivergenciaRecontagemDb,
  findRecontagemAbertaByDemandaDb,
  findRecontagemAbertaByDivergenciaDb,
  listRecontagensComContagemPendenteReconciliacaoDb,
} from './inventario-divergencia-recontagens.drizzle.js';
import {
  createInventarioDb,
  findInventarioByIdDb,
  getInventarioDetalheDb,
  getInventarioKpiDb,
  getInventarioTrendDb,
  iniciarInventarioDb,
  listInventariosDb,
  updateInventarioStatusDb,
} from './inventario-crud.drizzle.js';
import { findEnderecosByIdsForCentroDb } from './find-enderecos-by-ids.drizzle.js';
import { resolveDemandaEnderecosDb } from './resolve-demanda-enderecos.drizzle.js';

@Injectable()
export class InventarioService implements IInventarioRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  createInventario(data: CreateInventarioInput) {
    return createInventarioDb(this.db, data);
  }

  findInventarioById(id: string) {
    return findInventarioByIdDb(this.db, id);
  }

  listInventarios(filter: ListInventariosFilter) {
    return listInventariosDb(this.db, filter);
  }

  updateInventarioStatus(id: string, status: InventarioRecord['status']) {
    return updateInventarioStatusDb(this.db, id, status);
  }

  iniciarInventario(id: string) {
    return iniciarInventarioDb(this.db, id);
  }

  getInventarioKpi() {
    return getInventarioKpiDb(this.db);
  }

  getInventarioTrend() {
    return getInventarioTrendDb(this.db);
  }

  getInventarioDetalhe(id: string) {
    return getInventarioDetalheDb(this.db, id);
  }

  resolveEnderecosForDemanda(centroId: string, filtros: DemandaFiltros) {
    return resolveDemandaEnderecosDb(this.db, centroId, filtros);
  }

  findEnderecosByIdsForCentro(
    centroId: string,
    enderecoIds: string[],
    skuBusca?: string,
  ) {
    return findEnderecosByIdsForCentroDb(
      this.db,
      centroId,
      enderecoIds,
      skuBusca,
    );
  }

  createDemanda(data: CreateDemandaContagemInput, enderecoIds: string[]) {
    return createDemandaDb(this.db, data, enderecoIds);
  }

  listDemandasByInventario(inventarioId: string) {
    return listDemandasByInventarioDb(this.db, inventarioId);
  }

  deleteDemanda(inventarioId: string, demandaId: string) {
    return deleteDemandaDb(this.db, inventarioId, demandaId);
  }

  findDemandaById(demandaId: string) {
    return findDemandaByIdDb(this.db, demandaId);
  }

  listDemandasForOperator(operatorId: number) {
    return listDemandasForOperatorDb(this.db, operatorId);
  }

  listAllContagemDemandas() {
    return listAllContagemDemandasDb(this.db);
  }

  listDemandaEnderecos(demandaId: string) {
    return listDemandaEnderecosDb(this.db, demandaId);
  }

  findDemandaEnderecoById(demandaId: string, itemId: string) {
    return findDemandaEnderecoByIdDb(this.db, demandaId, itemId);
  }

  submitContagemCega(
    input: SubmitContagemCegaInput & {
      produtoId?: string | null;
      saldoEnderecoId?: string | null;
    },
  ) {
    return submitContagemCegaDb(this.db, input);
  }

  submitContagemValidacao(input: SubmitContagemValidacaoDbInput) {
    return submitContagemValidacaoDb(this.db, input);
  }

  submitContagemAvaria(input: SubmitContagemAvariaInput) {
    return submitContagemAvariaDb(this.db, input);
  }

  markDemandaEnderecoEmAndamento(itemId: string) {
    return markDemandaEnderecoEmAndamentoDb(this.db, itemId);
  }

  activateDemandaContagem(demandaId: string) {
    return activateDemandaContagemDb(this.db, demandaId);
  }

  listInventarioDivergencias(inventarioId: string) {
    return listInventarioDivergenciasDb(this.db, inventarioId);
  }

  listContagensValidacaoParaReconciliacao(inventarioId: string) {
    return listContagensValidacaoParaReconciliacaoDb(this.db, inventarioId);
  }

  createDivergencias(items: CreateDivergenciaInput[]) {
    return createDivergenciasDb(this.db, items);
  }

  listDivergenciasByInventario(inventarioId: string) {
    return listDivergenciasByInventarioDb(this.db, inventarioId);
  }

  findDivergenciaById(id: string) {
    return findDivergenciaByIdDb(this.db, id);
  }

  updateDivergenciaStatus(id: string, data: UpdateDivergenciaStatusInput) {
    return updateDivergenciaStatusDb(this.db, id, data);
  }

  updateDivergenciaContagem(id: string, data: UpdateDivergenciaContagemInput) {
    return updateDivergenciaContagemDb(this.db, id, data);
  }

  findRecontagemAbertaByDivergencia(divergenciaId: string) {
    return findRecontagemAbertaByDivergenciaDb(this.db, divergenciaId);
  }

  findRecontagemAbertaByDemanda(demandaId: string) {
    return findRecontagemAbertaByDemandaDb(this.db, demandaId);
  }

  createDivergenciaRecontagem(input: CreateDivergenciaRecontagemInput) {
    return createDivergenciaRecontagemDb(this.db, input);
  }

  concluirDemandaContagemSeCompleta(demandaId: string) {
    return concluirDemandaContagemSeCompletaDb(this.db, demandaId);
  }

  listRecontagensComContagemPendenteReconciliacao(inventarioId: string) {
    return listRecontagensComContagemPendenteReconciliacaoDb(
      this.db,
      inventarioId,
    );
  }
}
