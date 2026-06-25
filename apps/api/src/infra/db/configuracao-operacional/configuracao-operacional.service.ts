import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateConfiguracaoOperacionalInput,
  SubtipoConfiguracao,
  UpdateConfiguracaoOperacionalInput,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { RegrasPausaPadraoMap } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type {
  IConfiguracaoOperacionalRepository,
  ListConfiguracoesOperacionaisFilter,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import { createConfiguracaoOperacionalDb } from './create-configuracao-operacional.drizzle.js';
import { deleteConfiguracaoOperacionalDb } from './delete-configuracao-operacional.drizzle.js';
import { duplicarConfiguracaoOperacionalDb } from './duplicar-configuracao-operacional.drizzle.js';
import { findConfiguracaoOperacionalByIdDb } from './find-configuracao-operacional-by-id.drizzle.js';
import {
  findConfiguracaoOperacionalByUnidadeDominioCategoriaSubtipoNomeDb,
  listConfiguracoesOperacionaisDb,
} from './list-configuracoes-operacionais.drizzle.js';
import { setPadraoConfiguracaoOperacionalDb } from './set-padrao-configuracao-operacional.drizzle.js';
import { updateConfiguracaoOperacionalDb } from './update-configuracao-operacional.drizzle.js';
import { obterRegrasPausaPadraoDb } from './obter-regras-pausa-padrao.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class ConfiguracaoOperacionalService implements IConfiguracaoOperacionalRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  list(filter: ListConfiguracoesOperacionaisFilter) {
    return listConfiguracoesOperacionaisDb(this.db, filter);
  }

  findById(id: string) {
    return findConfiguracaoOperacionalByIdDb(this.db, id);
  }

  findByUnidadeDominioCategoriaSubtipoNome(
    unidadeId: string,
    dominio: string,
    categoria: string,
    subtipo: SubtipoConfiguracao,
    nome: string,
  ) {
    return findConfiguracaoOperacionalByUnidadeDominioCategoriaSubtipoNomeDb(
      this.db,
      unidadeId,
      dominio,
      categoria,
      subtipo,
      nome,
    );
  }

  create(data: CreateConfiguracaoOperacionalInput) {
    return createConfiguracaoOperacionalDb(this.db, data);
  }

  update(id: string, data: UpdateConfiguracaoOperacionalInput) {
    return updateConfiguracaoOperacionalDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteConfiguracaoOperacionalDb(this.db, id);
  }

  definirPadrao(
    id: string,
    unidadeId: string,
    dominio: string,
    categoria: string,
    subtipo: SubtipoConfiguracao,
  ) {
    return setPadraoConfiguracaoOperacionalDb(
      this.db,
      id,
      unidadeId,
      dominio,
      categoria,
      subtipo,
    );
  }

  duplicar(id: string) {
    return duplicarConfiguracaoOperacionalDb(this.db, id);
  }

  findRegrasPausaPadrao(unidadeId: string): Promise<RegrasPausaPadraoMap> {
    return obterRegrasPausaPadraoDb(this.db, unidadeId);
  }
}
