import { Inject, Injectable } from '@nestjs/common';

import type { SaveArmazemLayoutInput } from '../../../domain/model/armazem-layout/armazem-layout.model.js';
import {
  ARMAZEM_LAYOUT_REPOSITORY,
  type IArmazemLayoutRepository,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';
import { DRIZZLE_PROVIDER } from '../providers/drizzle/drizzle.provider.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  findArmazemLayoutByUnidadeDb,
  findArmazemLayoutOcupacaoByUnidadeDb,
  saveArmazemLayoutDb,
  vincularArmazemLayoutSlotEnderecoDb,
} from './armazem-layout.drizzle.js';

@Injectable()
export class ArmazemLayoutService implements IArmazemLayoutRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  findByUnidadeId(unidadeId: string) {
    return findArmazemLayoutByUnidadeDb(this.db, unidadeId);
  }

  save(input: SaveArmazemLayoutInput) {
    return saveArmazemLayoutDb(this.db, input);
  }

  findOcupacaoByUnidadeId(unidadeId: string) {
    return findArmazemLayoutOcupacaoByUnidadeDb(this.db, unidadeId);
  }

  vincularSlotEndereco(slotId: string, enderecoId: string | null) {
    return vincularArmazemLayoutSlotEnderecoDb(this.db, slotId, enderecoId);
  }
}
