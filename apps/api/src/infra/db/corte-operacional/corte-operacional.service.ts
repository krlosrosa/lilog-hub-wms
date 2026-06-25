import { Inject, Injectable } from '@nestjs/common';

import type {
  CancelarCorteInput,
  ListCortesInput,
  TransicaoCorteInput,
} from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  CORTE_OPERACIONAL_REPOSITORY,
  type CorteDetalheRecord,
  type CorteRecord,
  type ICorteOperacionalRepository,
  type MapaGrupoCorteRecord,
  type MapaGrupoItemValidacaoRecord,
  type SolicitarCortePersistInput,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';
import { DRIZZLE_PROVIDER, type DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  existsCorteAtivoByMapaGrupoIdDb,
  findCorteByIdDb,
  findMapaGrupoItensByIdsDb,
  findMapaGrupoPorCodigoDb,
  listCortesDb,
  solicitarCorteDb,
  updateCorteStatusDb,
} from './corte-operacional.drizzle.js';

@Injectable()
export class CorteOperacionalService implements ICorteOperacionalRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  findMapaGrupoPorCodigo(
    codigo: string,
    unidadeId: string,
  ): Promise<MapaGrupoCorteRecord | null> {
    return findMapaGrupoPorCodigoDb(this.db, codigo, unidadeId);
  }

  findMapaGrupoItensByIds(
    mapaGrupoItemIds: string[],
    mapaGrupoId: string,
  ): Promise<MapaGrupoItemValidacaoRecord[]> {
    return findMapaGrupoItensByIdsDb(this.db, mapaGrupoItemIds, mapaGrupoId);
  }

  existsCorteAtivoByMapaGrupoId(mapaGrupoId: string): Promise<boolean> {
    return existsCorteAtivoByMapaGrupoIdDb(this.db, mapaGrupoId);
  }

  solicitarCorte(input: SolicitarCortePersistInput): Promise<CorteDetalheRecord> {
    return solicitarCorteDb(this.db, input);
  }

  listCortes(
    input: ListCortesInput,
  ): Promise<{ items: CorteRecord[]; total: number }> {
    return listCortesDb(this.db, input);
  }

  findCorteById(
    corteId: string,
    unidadeId: string,
  ): Promise<CorteDetalheRecord | null> {
    return findCorteByIdDb(this.db, corteId, unidadeId);
  }

  iniciarCorte(input: TransicaoCorteInput): Promise<CorteDetalheRecord | null> {
    return updateCorteStatusDb(this.db, {
      corteId: input.corteId,
      unidadeId: input.unidadeId,
      status: 'em_andamento',
      userId: input.userId,
    });
  }

  realizarCorte(input: TransicaoCorteInput): Promise<CorteDetalheRecord | null> {
    return updateCorteStatusDb(this.db, {
      corteId: input.corteId,
      unidadeId: input.unidadeId,
      status: 'concluido',
      userId: input.userId,
    });
  }

  cancelarCorte(input: CancelarCorteInput): Promise<CorteDetalheRecord | null> {
    return updateCorteStatusDb(this.db, {
      corteId: input.corteId,
      unidadeId: input.unidadeId,
      status: 'cancelado',
      userId: input.canceladoPor,
      motivoCancelamento: input.motivoCancelamento,
    });
  }
}
