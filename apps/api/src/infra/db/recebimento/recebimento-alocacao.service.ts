import { Inject, Injectable } from '@nestjs/common';

import type {
  ApoioRecebimentoRecord,
  CriarAlocacaoRecebimentoInput,
  CriarApoioRecebimentoInput,
  DemandaRecebimentoComAlocacao,
  IRecebimentoAlocacaoRepository,
  RecebimentoAlocacaoRecord,
  UltimaMissaoFinalizadaRecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import {
  criarAlocacaoRecebimentoDb,
  findAlocacaoAtivaByPreRecebimentoIdDb,
  marcarAlocacaoIniciadaDb,
} from './criar-alocacao-recebimento.drizzle.js';
import { criarApoioRecebimentoDb } from './criar-apoio-recebimento.drizzle.js';
import { cancelarAlocacaoRecebimentoDb } from './cancelar-alocacao-recebimento.drizzle.js';
import { cancelarApoioRecebimentoDb } from './cancelar-apoio-recebimento.drizzle.js';
import { encerrarApoioRecebimentoDb } from './encerrar-apoio-recebimento.drizzle.js';
import {
  findApoioAtivoDb,
  listApoiosByFuncionarioDb,
  listApoiosByPreRecebimentoIdDb,
} from './list-apoios-recebimento.drizzle.js';
import { getDemandasRecebimentoComAlocacaoDb } from './get-recursos-recebimento-sessao.drizzle.js';
import { listUltimasMissoesFinalizadasRecebimentoSessaoDb } from './list-ultimas-missoes-finalizadas-recebimento-sessao.drizzle.js';

@Injectable()
export class RecebimentoAlocacaoService implements IRecebimentoAlocacaoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  criar(input: CriarAlocacaoRecebimentoInput): Promise<RecebimentoAlocacaoRecord> {
    return criarAlocacaoRecebimentoDb(this.db, input);
  }

  criarApoio(input: CriarApoioRecebimentoInput): Promise<RecebimentoAlocacaoRecord> {
    return criarApoioRecebimentoDb(this.db, input);
  }

  findAtivaByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<RecebimentoAlocacaoRecord | null> {
    return findAlocacaoAtivaByPreRecebimentoIdDb(this.db, preRecebimentoId);
  }

  findApoioAtivo(
    preRecebimentoId: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord | null> {
    return findApoioAtivoDb(this.db, preRecebimentoId, funcionarioId);
  }

  cancelar(id: string): Promise<RecebimentoAlocacaoRecord> {
    return cancelarAlocacaoRecebimentoDb(this.db, id);
  }

  cancelarApoio(id: string): Promise<RecebimentoAlocacaoRecord> {
    return cancelarApoioRecebimentoDb(this.db, id);
  }

  encerrarApoio(
    id: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord> {
    return encerrarApoioRecebimentoDb(this.db, id, funcionarioId);
  }

  marcarIniciada(preRecebimentoId: string): Promise<void> {
    return marcarAlocacaoIniciadaDb(this.db, preRecebimentoId);
  }

  listApoiosByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<ApoioRecebimentoRecord[]> {
    return listApoiosByPreRecebimentoIdDb(this.db, preRecebimentoId);
  }

  listApoiosByFuncionario(
    sessaoId: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord[]> {
    return listApoiosByFuncionarioDb(this.db, sessaoId, funcionarioId);
  }

  listDemandasComAlocacao(
    sessaoId: string,
    unidadeId: string,
  ): Promise<DemandaRecebimentoComAlocacao[]> {
    return getDemandasRecebimentoComAlocacaoDb(this.db, sessaoId, unidadeId);
  }

  listUltimasMissoesFinalizadasPorSessao(
    sessaoId: string,
    unidadeId: string,
    sessaoInicio: Date | null,
    funcionarioIds: number[],
  ): Promise<UltimaMissaoFinalizadaRecebimentoRecord[]> {
    return listUltimasMissoesFinalizadasRecebimentoSessaoDb(
      this.db,
      sessaoId,
      unidadeId,
      sessaoInicio,
      funcionarioIds,
    );
  }
}
