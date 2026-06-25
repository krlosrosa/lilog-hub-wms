import { Inject, Injectable } from '@nestjs/common';

import type {
  CreateClienteEspecialInput,
  UpdateClienteEspecialInput,
} from '../../../domain/model/expedicao/cliente-especial.model.js';
import type {
  IClienteEspecialRepository,
  ListClientesEspeciaisFilter,
} from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import { createClienteEspecialDb } from './create-cliente-especial.drizzle.js';
import { deleteClienteEspecialDb } from './delete-cliente-especial.drizzle.js';
import { findClienteEspecialByIdDb } from './find-cliente-especial-by-id.drizzle.js';
import {
  findClienteEspecialByUnidadeAndCodClienteDb,
  findClientesEspeciaisPorCodigosDb,
} from './find-clientes-especiais-por-codigos.drizzle.js';
import { listClientesEspeciaisDb } from './list-clientes-especiais.drizzle.js';
import { updateClienteEspecialDb } from './update-cliente-especial.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class ClienteEspecialService implements IClienteEspecialRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  list(filter: ListClientesEspeciaisFilter) {
    return listClientesEspeciaisDb(this.db, filter);
  }

  findById(id: string) {
    return findClienteEspecialByIdDb(this.db, id);
  }

  findByUnidadeAndCodCliente(unidadeId: string, codCliente: string) {
    return findClienteEspecialByUnidadeAndCodClienteDb(
      this.db,
      unidadeId,
      codCliente,
    );
  }

  findByCodigos(unidadeId: string, codClientes: string[]) {
    return findClientesEspeciaisPorCodigosDb(this.db, unidadeId, codClientes);
  }

  create(data: CreateClienteEspecialInput) {
    return createClienteEspecialDb(this.db, data);
  }

  update(id: string, data: UpdateClienteEspecialInput) {
    return updateClienteEspecialDb(this.db, id, data);
  }

  delete(id: string) {
    return deleteClienteEspecialDb(this.db, id);
  }
}
