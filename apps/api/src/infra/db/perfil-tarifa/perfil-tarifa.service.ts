import { Inject, Injectable } from '@nestjs/common';

import type {
  CreatePerfilTarifaInput,
  UpdatePerfilTarifaInput,
  UpsertFaixasKmInput,
} from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  PERFIL_TARIFA_REPOSITORY,
  type IPerfilTarifaRepository,
  type ListPerfisTarifasFilter,
} from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createPerfilTarifaDb } from './create-perfil-tarifa.drizzle.js';
import { deletePerfilTarifaDb } from './delete-perfil-tarifa.drizzle.js';
import {
  findPerfilTarifaByIdDb,
  findPerfilTarifaByUnidadeAndRavexIdDb,
} from './find-perfil-tarifa.drizzle.js';
import { listPerfisTarifasDb } from './list-perfis-tarifas.drizzle.js';
import { updatePerfilTarifaDb } from './update-perfil-tarifa.drizzle.js';
import { upsertFaixasKmDb } from './upsert-faixas-km.drizzle.js';

@Injectable()
export class PerfilTarifaService implements IPerfilTarifaRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  list(filter: ListPerfisTarifasFilter) {
    return listPerfisTarifasDb(this.db, filter);
  }

  findById(id: string) {
    return findPerfilTarifaByIdDb(this.db, id);
  }

  findByUnidadeAndRavexId(unidadeId: string, idRavex: number) {
    return findPerfilTarifaByUnidadeAndRavexIdDb(
      this.db,
      unidadeId,
      idRavex,
    );
  }

  create(data: CreatePerfilTarifaInput) {
    return createPerfilTarifaDb(this.db, data);
  }

  update(id: string, data: UpdatePerfilTarifaInput) {
    return updatePerfilTarifaDb(this.db, id, data);
  }

  delete(id: string) {
    return deletePerfilTarifaDb(this.db, id);
  }

  upsertFaixasKm(id: string, data: UpsertFaixasKmInput) {
    return upsertFaixasKmDb(this.db, id, data);
  }
}
