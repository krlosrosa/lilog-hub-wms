import { Inject, Injectable } from '@nestjs/common';

import type {
  CreatePreRecebimentoInput,
  PreRecebimentoSituacao,
  RecepcionarCarroInput,
  UpdatePreRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  IPreRecebimentoRepository,
  ListPreRecebimentosFilter,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createPreRecebimentoDb } from './create-pre-recebimento.drizzle.js';
import { findPreRecebimentoByIdDb } from './find-pre-recebimento.drizzle.js';
import { listPreRecebimentosDb } from './list-pre-recebimentos.drizzle.js';
import { updatePreRecebimentoDb } from './update-pre-recebimento.drizzle.js';
import { updatePreRecebimentoSituacaoDb } from './update-pre-recebimento-situacao.drizzle.js';
import { liberarConferenciaPreRecebimentoDb } from './liberar-conferencia-pre-recebimento.drizzle.js';
import { recepcionarCarroPreRecebimentoDb } from './recepcionar-carro-pre-recebimento.drizzle.js';
import { gerarLinkRastreioDb } from './gerar-link-rastreio.drizzle.js';
import { findRastreioByTokenDb } from './find-rastreio-by-token.drizzle.js';

@Injectable()
export class PreRecebimentoService implements IPreRecebimentoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreatePreRecebimentoInput, userId: number | null) {
    return createPreRecebimentoDb(this.db, data, userId);
  }

  update(id: string, data: UpdatePreRecebimentoInput) {
    return updatePreRecebimentoDb(this.db, id, data);
  }

  findById(id: string) {
    return findPreRecebimentoByIdDb(this.db, id);
  }

  list(filter: ListPreRecebimentosFilter) {
    return listPreRecebimentosDb(this.db, filter);
  }

  updateSituacao(
    id: string,
    situacao: PreRecebimentoSituacao,
    dataChegada?: Date | null,
  ) {
    return updatePreRecebimentoSituacaoDb(this.db, id, situacao, dataChegada);
  }

  liberarConferencia(id: string, docaId: string, dataChegada: Date) {
    return liberarConferenciaPreRecebimentoDb(
      this.db,
      id,
      docaId,
      dataChegada,
    );
  }

  recepcionarCarro(id: string, data: RecepcionarCarroInput) {
    return recepcionarCarroPreRecebimentoDb(this.db, id, data);
  }

  cancel(id: string) {
    return updatePreRecebimentoSituacaoDb(this.db, id, 'cancelado');
  }

  gerarLinkRastreio(id: string, options?: { regenerar?: boolean }) {
    return gerarLinkRastreioDb(this.db, id, options?.regenerar ?? false);
  }

  findRastreioByToken(token: string) {
    return findRastreioByTokenDb(this.db, token);
  }
}
