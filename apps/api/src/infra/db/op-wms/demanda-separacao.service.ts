import { Inject, Injectable } from '@nestjs/common';

import type { CriarDemandasSeparacaoInput } from '../../../domain/model/op-wms/demanda-separacao.model.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type DemandaFuncionarioPapelRecord,
  type DemandaFuncionarioRecord,
  type DemandaSeparacaoDetalheRecord,
  type DemandaSeparacaoRecord,
  type IDemandaSeparacaoRepository,
  type MapaGrupoDisponivelRecord,
  type MapaResumoTransporteRecord,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import { DRIZZLE_PROVIDER, type DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  deleteDemandaFuncionarioDb,
  insertDemandaFuncionarioDb,
  listDemandaFuncionariosByDemandaIdsDb,
  listDemandaFuncionariosDb,
} from './demanda-operacional-funcionarios.drizzle.js';
import {
  findDemandaDetalheByIdDb,
  findDemandasAtivasByMapaGrupoIdsDb,
  findMapaGruposByIdsDb,
  insertDemandasSeparacaoDb,
  listDemandasSeparacaoBySessaoDb,
  listMapasGrupoDisponiveisDb,
} from './demanda-separacao.drizzle.js';
import { finalizarDemandaSeparacaoDb } from './finalizar-demanda-separacao.drizzle.js';
import { resumoMapasTransportesDb } from './resumo-mapas-transporte.drizzle.js';

@Injectable()
export class DemandaSeparacaoService implements IDemandaSeparacaoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  listBySessaoId(sessaoId: string): Promise<DemandaSeparacaoDetalheRecord[]> {
    return listDemandasSeparacaoBySessaoDb(this.db, sessaoId);
  }

  listMapasGrupoDisponiveis(
    unidadeId: string,
    processo?: 'separacao' | 'conferencia' | 'carregamento',
  ): Promise<MapaGrupoDisponivelRecord[]> {
    return listMapasGrupoDisponiveisDb(this.db, unidadeId, processo);
  }

  resumoMapasTransportes(
    unidadeId: string,
    transporteIds: string[],
  ): Promise<MapaResumoTransporteRecord[]> {
    return resumoMapasTransportesDb(this.db, unidadeId, transporteIds);
  }

  findMapaGrupoByIds(mapaGrupoIds: string[], unidadeId: string) {
    return findMapaGruposByIdsDb(this.db, mapaGrupoIds, unidadeId);
  }

  findDemandasAtivasByMapaGrupoIds(
    mapaGrupoIds: string[],
  ): Promise<DemandaSeparacaoRecord[]> {
    return findDemandasAtivasByMapaGrupoIdsDb(this.db, mapaGrupoIds);
  }

  createBatch(
    input: CriarDemandasSeparacaoInput & { unidadeId: string },
  ): Promise<DemandaSeparacaoDetalheRecord[]> {
    return insertDemandasSeparacaoDb(
      this.db,
      input.mapaGrupoIds.map((mapaGrupoId) => ({
        unidadeId: input.unidadeId,
        sessaoId: input.sessaoId,
        mapaGrupoId,
        sessaoFuncionarioId: input.sessaoFuncionarioId,
        atribuidoPor: input.atribuidoPor,
      })),
    );
  }

  findDetalheById(
    demandaId: string,
  ): Promise<DemandaSeparacaoDetalheRecord | null> {
    return findDemandaDetalheByIdDb(this.db, demandaId);
  }

  finalizarDemanda(
    demandaId: string,
  ): Promise<DemandaSeparacaoDetalheRecord | null> {
    return finalizarDemandaSeparacaoDb(this.db, demandaId);
  }

  addFuncionario(
    demandaId: string,
    sessaoFuncionarioId: string,
    papel: DemandaFuncionarioPapelRecord,
  ): Promise<DemandaFuncionarioRecord> {
    return insertDemandaFuncionarioDb(this.db, {
      demandaId,
      sessaoFuncionarioId,
      papel,
    });
  }

  removeFuncionario(
    demandaId: string,
    sessaoFuncionarioId: string,
  ): Promise<void> {
    return deleteDemandaFuncionarioDb(this.db, demandaId, sessaoFuncionarioId);
  }

  listFuncionarios(demandaId: string): Promise<DemandaFuncionarioRecord[]> {
    return listDemandaFuncionariosDb(this.db, demandaId);
  }

  listFuncionariosByDemandaIds(
    demandaIds: string[],
  ): Promise<DemandaFuncionarioRecord[]> {
    return listDemandaFuncionariosByDemandaIdsDb(this.db, demandaIds);
  }
}
