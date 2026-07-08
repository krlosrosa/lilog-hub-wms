import { Inject, Injectable } from '@nestjs/common';

import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type AtualizarItemProcessoInput,
  type AtualizarItemProcessoResult,
  type AtualizarItensProcessoEmMassaInput,
  type AtualizarItensProcessoEmMassaResult,
  type AtualizarStatusDocumentoInput,
  type AtualizarStatusDocumentoResult,
  type AtualizarStatusProcessoInput,
  type AtualizarStatusProcessoResult,
  type CriarDocumentoCobrancaInput,
  type CriarDocumentoCobrancaResult,
  type CriarProcessoDebitoInput,
  type CriarProcessoDebitoResult,
  type CriarInteracaoInput,
  type CriarNotificacaoPortalInput,
  type DocumentoCobrancaDetalheRecord,
  type DocumentoCobrancaListItem,
  type ICobrancaTransportadoraRepository,
  type InteracaoRecord,
  type ListarDocumentosFilter,
  type ListarProcessosFilter,
  type ListarProcessosPortalFilter,
  type NotificacaoPortalRecord,
  type ProcessoDebitoDetalheRecord,
  type ProcessoDebitoListItem,
  type ProcessoDebitoResumoPortal,
  type RemoverItemProcessoInput,
  type RemoverItemProcessoResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { atualizarItemProcessoDebitoDb } from './atualizar-item-processo-debito.drizzle.js';
import { atualizarItensProcessoDebitoEmMassaDb } from './atualizar-itens-processo-debito-em-massa.drizzle.js';
import { removerItemProcessoDebitoDb } from './remover-item-processo-debito.drizzle.js';
import { atualizarStatusDocumentoCobrancaDb } from './atualizar-status-documento-cobranca.drizzle.js';
import { atualizarStatusProcessoDebitoDb } from './atualizar-status-processo-debito.drizzle.js';
import { buscarDocumentoCobrancaDetalheDb } from './buscar-documento-cobranca-detalhe.drizzle.js';
import { buscarProcessoDebitoDetalheDb } from './buscar-processo-debito-detalhe.drizzle.js';
import {
  buscarProcessoPorDemandaIdDb,
  criarProcessoDebitoDb,
} from './criar-processo-debito.drizzle.js';
import { criarDocumentoCobrancaDb } from './criar-documento-cobranca.drizzle.js';
import { criarInteracaoDb, listarInteracoesDb } from './criar-interacao.drizzle.js';
import { criarNotificacaoPortalDb } from './criar-notificacao-portal.drizzle.js';
import { listarDocumentosCobrancaDb } from './listar-documentos-cobranca.drizzle.js';
import { listarNotificacoesPortalDb } from './listar-notificacoes-portal.drizzle.js';
import { listarProcessosDebitoDb } from './listar-processos-debito.drizzle.js';
import { marcarNotificacoesLidasDb } from './marcar-notificacoes-lidas.drizzle.js';
import {
  buscarProcessoResumoPortalDb,
  listarProcessosDebitoPortalDb,
} from './listar-processos-debito-portal.drizzle.js';

@Injectable()
export class CobrancaTransportadoraService implements ICobrancaTransportadoraRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  buscarProcessoPorDemandaId(
    demandaId: string,
    unidadeId: string,
  ): Promise<ProcessoDebitoListItem | null> {
    return buscarProcessoPorDemandaIdDb(this.db, demandaId, unidadeId);
  }

  criarProcessoDebito(
    input: CriarProcessoDebitoInput,
  ): Promise<CriarProcessoDebitoResult> {
    return criarProcessoDebitoDb(this.db, input);
  }

  listarProcessos(
    filter: ListarProcessosFilter,
  ): Promise<ProcessoDebitoListItem[]> {
    return listarProcessosDebitoDb(this.db, filter);
  }

  buscarProcessoDetalhe(
    processoId: string,
    unidadeId: string,
  ): Promise<ProcessoDebitoDetalheRecord | null> {
    return buscarProcessoDebitoDetalheDb(this.db, processoId, unidadeId);
  }

  atualizarStatusProcesso(
    input: AtualizarStatusProcessoInput,
  ): Promise<AtualizarStatusProcessoResult | null> {
    return atualizarStatusProcessoDebitoDb(this.db, input);
  }

  atualizarItemProcesso(
    input: AtualizarItemProcessoInput,
  ): Promise<AtualizarItemProcessoResult | null> {
    return atualizarItemProcessoDebitoDb(this.db, input);
  }

  atualizarItensProcessoEmMassa(
    input: AtualizarItensProcessoEmMassaInput,
  ): Promise<AtualizarItensProcessoEmMassaResult | null> {
    return atualizarItensProcessoDebitoEmMassaDb(this.db, input);
  }

  removerItemProcesso(
    input: RemoverItemProcessoInput,
  ): Promise<RemoverItemProcessoResult | null> {
    return removerItemProcessoDebitoDb(this.db, input);
  }

  criarDocumentoCobranca(
    input: CriarDocumentoCobrancaInput,
  ): Promise<CriarDocumentoCobrancaResult> {
    return criarDocumentoCobrancaDb(this.db, input);
  }

  listarDocumentos(
    filter: ListarDocumentosFilter,
  ): Promise<DocumentoCobrancaListItem[]> {
    return listarDocumentosCobrancaDb(this.db, filter);
  }

  buscarDocumentoDetalhe(
    documentoId: string,
    unidadeId: string,
  ): Promise<DocumentoCobrancaDetalheRecord | null> {
    return buscarDocumentoCobrancaDetalheDb(this.db, documentoId, unidadeId);
  }

  atualizarStatusDocumento(
    input: AtualizarStatusDocumentoInput,
  ): Promise<AtualizarStatusDocumentoResult | null> {
    return atualizarStatusDocumentoCobrancaDb(this.db, input);
  }

  listarProcessosPortal(
    filter: ListarProcessosPortalFilter,
  ): Promise<ProcessoDebitoListItem[]> {
    return listarProcessosDebitoPortalDb(this.db, filter);
  }

  buscarProcessoResumoPortal(
    processoId: string,
    transportadoraId: string,
  ): Promise<ProcessoDebitoResumoPortal | null> {
    return buscarProcessoResumoPortalDb(this.db, processoId, transportadoraId);
  }

  criarInteracao(data: CriarInteracaoInput): Promise<InteracaoRecord> {
    return criarInteracaoDb(this.db, data);
  }

  listarInteracoes(processoDebitoId: string): Promise<InteracaoRecord[]> {
    return listarInteracoesDb(this.db, processoDebitoId);
  }

  criarNotificacaoPortal(input: CriarNotificacaoPortalInput): Promise<void> {
    return criarNotificacaoPortalDb(this.db, input);
  }

  listarNotificacoesPortal(
    transportadoraId: string,
    apenasNaoLidas?: boolean,
    limit?: number,
  ): Promise<{
    notificacoes: NotificacaoPortalRecord[];
    totalNaoLidas: number;
  }> {
    return listarNotificacoesPortalDb(this.db, {
      transportadoraId,
      apenasNaoLidas,
      limit,
    });
  }

  marcarNotificacoesLidas(
    ids: string[],
    transportadoraId: string,
  ): Promise<void> {
    return marcarNotificacoesLidasDb(this.db, ids, transportadoraId);
  }
}

// Re-export token for convenience in modules
export { COBRANCA_TRANSPORTADORA_REPOSITORY };
