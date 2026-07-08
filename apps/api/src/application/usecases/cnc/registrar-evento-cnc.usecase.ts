import { Inject, Injectable } from '@nestjs/common';

import {
  CNC_REPOSITORY,
  type AddCncEventoInput,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import type { RegistrarEventoCncJobData } from '../../../infra/queues/cnc-queue.js';

@Injectable()
export class RegistrarEventoCncUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
  ) {}

  execute(data: RegistrarEventoCncJobData) {
    const input: AddCncEventoInput = {
      cncId: data.cncId,
      tipoEvento: data.tipoEvento,
      situacaoAnterior: data.situacaoAnterior,
      situacaoNova: data.situacaoNova,
      descricao: data.descricao,
      metadata: data.metadata,
      criadoPorUserId: data.criadoPorUserId,
    };

    return this.cncRepository.addEvento(input);
  }
}
