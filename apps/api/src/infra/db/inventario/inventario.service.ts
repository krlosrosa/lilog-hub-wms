import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateDemandaContagemInput,
  CreateInventarioInput,
  DemandaFiltros,
  SubmitContagemAvariaInput,
  SubmitContagemCegaInput,
  SubmitContagemValidacaoInput,
} from '../../../domain/model/inventario/inventario.model.js';
import type {
  IInventarioRepository,
  InventarioRecord,
  ListInventariosFilter,
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
} from './demanda-crud.drizzle.js';
import {
  submitContagemAvariaDb,
  submitContagemCegaDb,
  submitContagemValidacaoDb,
} from './contagem-submit.drizzle.js';
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

  findEnderecosByIdsForCentro(centroId: string, enderecoIds: string[]) {
    return findEnderecosByIdsForCentroDb(this.db, centroId, enderecoIds);
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

  submitContagemCega(input: SubmitContagemCegaInput) {
    return submitContagemCegaDb(this.db, input);
  }

  submitContagemValidacao(input: SubmitContagemValidacaoInput) {
    return submitContagemValidacaoDb(this.db, input);
  }

  submitContagemAvaria(input: SubmitContagemAvariaInput) {
    return submitContagemAvariaDb(this.db, input);
  }

  markDemandaEnderecoEmAndamento(itemId: string) {
    return markDemandaEnderecoEmAndamentoDb(this.db, itemId);
  }
}
