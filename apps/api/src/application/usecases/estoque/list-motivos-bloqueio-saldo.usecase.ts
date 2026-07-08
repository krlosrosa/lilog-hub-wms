import { Inject, Injectable } from '@nestjs/common';

import type { ListMotivosBloqueioSaldoFilter } from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';
import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

@Injectable()
export class ListMotivosBloqueioSaldoUseCase {
  constructor(
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  execute(filter: ListMotivosBloqueioSaldoFilter) {
    return this.motivoBloqueioSaldoRepository.list(filter);
  }
}
