import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateConfiguracaoImpressaoInput,
  UpdateConfiguracaoImpressaoInput,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import type {
  IConfiguracaoImpressaoRepository,
  ListConfiguracoesImpressaoFilter,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { createConfiguracaoImpressaoDb } from './create-configuracao-impressao.drizzle.js';
import { deleteConfiguracaoImpressaoDb } from './delete-configuracao-impressao.drizzle.js';
import { findConfiguracaoImpressaoByIdDb } from './find-configuracao-impressao-by-id.drizzle.js';
import {
  findConfiguracaoImpressaoByUnidadeAndNomeDb,
  listConfiguracoesImpressaoDb,
} from './list-configuracoes-impressao.drizzle.js';
import { setPadraoConfiguracaoImpressaoDb } from './set-padrao-configuracao-impressao.drizzle.js';
import { updateConfiguracaoImpressaoDb } from './update-configuracao-impressao.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class ConfiguracaoImpressaoService implements IConfiguracaoImpressaoRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  list(filter: ListConfiguracoesImpressaoFilter) {
    return listConfiguracoesImpressaoDb(this.db, filter);
  }

  findById(id: string) {
    return findConfiguracaoImpressaoByIdDb(this.db, id);
  }

  findByUnidadeAndNome(unidadeId: string, nome: string) {
    return findConfiguracaoImpressaoByUnidadeAndNomeDb(
      this.db,
      unidadeId,
      nome,
    );
  }

  create(data: CreateConfiguracaoImpressaoInput) {
    return createConfiguracaoImpressaoDb(this.db, data);
  }

  update(id: string, data: UpdateConfiguracaoImpressaoInput) {
    return updateConfiguracaoImpressaoDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteConfiguracaoImpressaoDb(this.db, id);
  }

  definirPadrao(id: string, unidadeId: string) {
    return setPadraoConfiguracaoImpressaoDb(this.db, id, unidadeId);
  }
}
