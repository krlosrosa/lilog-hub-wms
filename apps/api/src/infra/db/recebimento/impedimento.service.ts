import { Inject, Injectable } from '@nestjs/common';

import {
  IMPEDIMENTO_REPOSITORY,
  type CreateImpedimentoInput,
  type IImpedimentoRepository,
  type ImpedimentoRecord,
} from '../../../domain/repositories/recebimento/impedimento.repository.js';
import { DRIZZLE_PROVIDER, type DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  findImpedimentoByPreRecebimentoIdDb,
  registrarImpedimentoDb,
} from './registrar-impedimento.drizzle.js';

@Injectable()
export class ImpedimentoService implements IImpedimentoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  create(data: CreateImpedimentoInput): Promise<ImpedimentoRecord> {
    return registrarImpedimentoDb(this.db, data);
  }

  findByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<ImpedimentoRecord | null> {
    return findImpedimentoByPreRecebimentoIdDb(this.db, preRecebimentoId);
  }
}
