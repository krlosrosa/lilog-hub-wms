import { Inject, Injectable } from '@nestjs/common';



import type {

  CreateEnderecoData,

  UpdateEnderecoData,

} from '../../../domain/model/endereco/endereco.model.js';

import {

  ENDERECO_REPOSITORY,

  type FindEnderecoProximoDisponivelInput,

  type IEnderecoRepository,

  type ListEnderecosFilter,

} from '../../../domain/repositories/endereco/endereco.repository.js';

import {

  DRIZZLE_PROVIDER,

  type DrizzleClient,

} from '../providers/drizzle/drizzle.provider.js';

import { bulkCreateEnderecosDb } from './bulk-create-enderecos.drizzle.js';

import { createEnderecoDb } from './create-endereco.drizzle.js';

import { deleteEnderecoDb } from './delete-endereco.drizzle.js';

import {

  findEnderecoByIdDb,

  findEnderecoByUnidadeAndCodigoDb,

  hasEnderecoMovementHistoryDb,

  hasEnderecoStockDb,

} from './find-endereco.drizzle.js';

import {

  getEnderecoKpiDb,

  listEnderecosDb,

} from './list-enderecos.drizzle.js';

import { updateEnderecoDb } from './update-endereco.drizzle.js';
import { findEnderecoProximoDisponivelDb } from './find-endereco-proximo-disponivel.drizzle.js';



@Injectable()

export class EnderecoService implements IEnderecoRepository {

  constructor(

    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,

  ) {}



  list(filter: ListEnderecosFilter) {

    return listEnderecosDb(this.db, filter);

  }



  getKpi(filter?: { unidadeId?: string }) {

    return getEnderecoKpiDb(this.db, filter);

  }



  findById(id: string) {

    return findEnderecoByIdDb(this.db, id);

  }



  findByUnidadeAndCodigo(unidadeId: string, enderecoMascarado: string) {

    return findEnderecoByUnidadeAndCodigoDb(

      this.db,

      unidadeId,

      enderecoMascarado,

    );

  }



  hasStock(id: string) {

    return hasEnderecoStockDb(this.db, id);

  }



  hasMovementHistory(id: string) {

    return hasEnderecoMovementHistoryDb(this.db, id);

  }



  create(data: CreateEnderecoData) {

    return createEnderecoDb(this.db, data);

  }



  createBulk(items: CreateEnderecoData[]) {

    return bulkCreateEnderecosDb(this.db, items);

  }



  update(id: string, data: UpdateEnderecoData) {

    return updateEnderecoDb(this.db, id, data);

  }



  delete(id: string) {

    return deleteEnderecoDb(this.db, id);

  }

  findEnderecoProximoDisponivel(input: FindEnderecoProximoDisponivelInput) {
    return findEnderecoProximoDisponivelDb(this.db, input);
  }

}


