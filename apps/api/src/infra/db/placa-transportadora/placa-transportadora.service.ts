import { Inject, Injectable } from '@nestjs/common';

import type {
  AtualizarPerfilPlacaInput,
  AtualizarPerfilPlacasMassaInput,
  BuscarPlacasUnidadeFilter,
  IPlacaTransportadoraRepository,
  ListPlacasTransportadoraFilter,
  ListPlacasUnidadeFilter,
  SyncPlacasTransportadoraInput,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { atualizarPerfilPlacaDb } from './atualizar-perfil-placa.drizzle.js';
import { atualizarPerfilPlacasMassaDb } from './atualizar-perfil-placas-massa.drizzle.js';
import { buscarPlacasUnidadeDb } from './buscar-placas-unidade.drizzle.js';
import { findPlacaTransportadoraByIdDb } from './find-placa-transportadora-by-id.drizzle.js';
import { listPlacasTransportadoraDb } from './list-placas-transportadora.drizzle.js';
import { listPlacasUnidadeDb } from './list-placas-unidade.drizzle.js';
import { syncPlacasTransportadoraDb } from './sync-placas-transportadora.drizzle.js';

@Injectable()
export class PlacaTransportadoraService implements IPlacaTransportadoraRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListPlacasTransportadoraFilter) {
    return listPlacasTransportadoraDb(this.db, filter);
  }

  listByUnidade(filter: ListPlacasUnidadeFilter) {
    return listPlacasUnidadeDb(this.db, filter);
  }

  buscarByPlacasUnidade(filter: BuscarPlacasUnidadeFilter) {
    return buscarPlacasUnidadeDb(this.db, filter);
  }

  findById(id: string) {
    return findPlacaTransportadoraByIdDb(this.db, id);
  }

  syncFromRavex(data: SyncPlacasTransportadoraInput) {
    return syncPlacasTransportadoraDb(this.db, data);
  }

  atualizarPerfil(data: AtualizarPerfilPlacaInput) {
    return atualizarPerfilPlacaDb(this.db, data).then((placa) => {
      if (!placa) {
        throw new Error(`Placa "${data.placaId}" não encontrada após atualização`);
      }

      return placa;
    });
  }

  atualizarPerfilMassa(data: AtualizarPerfilPlacasMassaInput) {
    return atualizarPerfilPlacasMassaDb(this.db, data);
  }
}
