import { Inject, Injectable } from '@nestjs/common';

import type {
  IConferenciaRepository,
  ListOperadorDemandasFilter,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import type {
  CreateChecklistRecebimentoInput,
  UpsertTemperaturaProdutoRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { createChecklistRecebimentoDb } from './create-checklist-recebimento.drizzle.js';
import { findChecklistRecebimentoDb } from './find-checklist-recebimento.drizzle.js';
import { getConferenciaContextDb } from './get-conferencia-context.drizzle.js';
import { listOperadorDemandasDb } from './list-operador-demandas.drizzle.js';
import { listTemperaturasProdutoRecebimentoDb } from './list-temperaturas-produto-recebimento.drizzle.js';
import { upsertTemperaturaProdutoRecebimentoDb } from './upsert-temperatura-produto-recebimento.drizzle.js';

@Injectable()
export class ConferenciaService implements IConferenciaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  listOperadorDemandas(filter: ListOperadorDemandasFilter) {
    return listOperadorDemandasDb(this.db, filter);
  }

  getConferenciaContext(preRecebimentoId: string) {
    return getConferenciaContextDb(this.db, preRecebimentoId);
  }

  findChecklistByRecebimentoId(recebimentoId: string) {
    return findChecklistRecebimentoDb(this.db, recebimentoId);
  }

  createChecklist(
    recebimentoId: string,
    data: CreateChecklistRecebimentoInput,
  ) {
    return createChecklistRecebimentoDb(this.db, recebimentoId, data);
  }

  listTemperaturasProduto(recebimentoId: string) {
    return listTemperaturasProdutoRecebimentoDb(this.db, recebimentoId);
  }

  upsertTemperaturaProduto(
    recebimentoId: string,
    data: UpsertTemperaturaProdutoRecebimentoInput,
    operatorId: number | null,
  ) {
    return upsertTemperaturaProdutoRecebimentoDb(
      this.db,
      recebimentoId,
      data,
      operatorId,
    );
  }
}
