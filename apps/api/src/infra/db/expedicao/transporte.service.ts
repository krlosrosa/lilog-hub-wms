import { Inject, Injectable } from '@nestjs/common';

import type {
  ITransporteRepository,
  SalvarAlocacoesTransportesInput,
  AtualizarPrioridadeTransporteInput,
  StatusTransporteOperacional,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { deleteTransporteDb } from './delete-transporte.drizzle.js';
import {
  atualizarStatusTransporteDb,
  findStatusTransporteDb,
} from './atualizar-status-transporte.drizzle.js';
import { findResumoGruposTransporteDb } from './find-resumo-grupos-transporte.drizzle.js';
import {
  findTransportesComMapaExistenteDb,
  findTransportesDuplicadosDb,
} from './find-transportes-duplicados.drizzle.js';
import { salvarAlocacoesTransportesDb } from './salvar-alocacoes-transportes.drizzle.js';
import { updateTransportePrioridadeDb } from './update-transporte-prioridade.drizzle.js';
import { findTransporteIdByViagemDb } from './find-transporte-id-by-viagem.drizzle.js';
import { findTransporteViagemRavexDb } from './find-transporte-viagem-ravex.drizzle.js';
import { atualizarViagemRavexTransporteDb } from './atualizar-viagem-ravex-transporte.drizzle.js';
import { updateDadosCarregamentoTransporteDb } from './update-dados-carregamento-transporte.drizzle.js';

@Injectable()
export class TransporteService implements ITransporteRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  salvarAlocacoes(input: SalvarAlocacoesTransportesInput) {
    return salvarAlocacoesTransportesDb(this.db, input);
  }

  excluir(id: string, unidadeId: string) {
    return deleteTransporteDb(this.db, id, unidadeId);
  }

  atualizarPrioridade(input: AtualizarPrioridadeTransporteInput) {
    return updateTransportePrioridadeDb(this.db, input);
  }

  findDuplicados(input: {
    unidadeId: string;
    dataTransporte: string;
    rotas: string[];
  }) {
    return findTransportesDuplicadosDb(this.db, input);
  }

  findComMapaExistente(input: {
    unidadeId: string;
    transporteIds: string[];
  }) {
    return findTransportesComMapaExistenteDb(this.db, input);
  }

  findResumoGruposOperacionais(transporteId: string) {
    return findResumoGruposTransporteDb(this.db, transporteId);
  }

  findStatusTransporte(transporteId: string, unidadeId: string) {
    return findStatusTransporteDb(this.db, transporteId, unidadeId);
  }

  atualizarStatusOperacional(input: {
    transporteId: string;
    unidadeId: string;
    status: StatusTransporteOperacional;
  }) {
    return atualizarStatusTransporteDb(this.db, input);
  }

  findViagemRavexContext(transporteId: string, unidadeId: string) {
    return findTransporteViagemRavexDb(this.db, transporteId, unidadeId);
  }

  findTransporteIdByViagemId(viagemId: number, unidadeId: string) {
    return findTransporteIdByViagemDb(this.db, viagemId, unidadeId);
  }

  atualizarViagemRavex(
    input: Parameters<typeof atualizarViagemRavexTransporteDb>[1],
  ) {
    return atualizarViagemRavexTransporteDb(this.db, input);
  }

  atualizarDadosCarregamento(
    input: Parameters<typeof updateDadosCarregamentoTransporteDb>[1],
  ) {
    return updateDadosCarregamentoTransporteDb(this.db, input);
  }
}
