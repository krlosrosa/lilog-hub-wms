import { Inject, Injectable } from '@nestjs/common';

import type {
  CriarAlocacaoRecebimentoInput,
  DemandaRecebimentoComAlocacao,
  IRecebimentoAlocacaoRepository,
  RecebimentoAlocacaoRecord,
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
import { cancelarAlocacaoRecebimentoDb } from './cancelar-alocacao-recebimento.drizzle.js';
import { getDemandasRecebimentoComAlocacaoDb } from './get-recursos-recebimento-sessao.drizzle.js';

@Injectable()
export class RecebimentoAlocacaoService implements IRecebimentoAlocacaoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  criar(input: CriarAlocacaoRecebimentoInput): Promise<RecebimentoAlocacaoRecord> {
    return criarAlocacaoRecebimentoDb(this.db, input);
  }

  findAtivaByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<RecebimentoAlocacaoRecord | null> {
    return findAlocacaoAtivaByPreRecebimentoIdDb(this.db, preRecebimentoId);
  }

  cancelar(id: string): Promise<RecebimentoAlocacaoRecord> {
    return cancelarAlocacaoRecebimentoDb(this.db, id);
  }

  marcarIniciada(preRecebimentoId: string): Promise<void> {
    return marcarAlocacaoIniciadaDb(this.db, preRecebimentoId);
  }

  listDemandasComAlocacao(
    sessaoId: string,
    unidadeId: string,
  ): Promise<DemandaRecebimentoComAlocacao[]> {
    return getDemandasRecebimentoComAlocacaoDb(this.db, sessaoId, unidadeId);
  }
}
