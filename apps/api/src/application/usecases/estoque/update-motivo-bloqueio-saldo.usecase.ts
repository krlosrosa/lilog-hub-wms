import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdateMotivoBloqueioSaldoInputSchema,
  type UpdateMotivoBloqueioSaldoInput,
} from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import {
  MOTIVO_BLOQUEIO_SALDO_REPOSITORY,
  type IMotivoBloqueioSaldoRepository,
} from '../../../domain/repositories/estoque/motivo-bloqueio-saldo.repository.js';

export type UpdateMotivoBloqueioSaldoUseCaseInput = {
  id: string;
  data: UpdateMotivoBloqueioSaldoInput;
};

@Injectable()
export class UpdateMotivoBloqueioSaldoUseCase {
  constructor(
    @Inject(MOTIVO_BLOQUEIO_SALDO_REPOSITORY)
    private readonly motivoBloqueioSaldoRepository: IMotivoBloqueioSaldoRepository,
  ) {}

  async execute({ id, data }: UpdateMotivoBloqueioSaldoUseCaseInput) {
    const parsed = UpdateMotivoBloqueioSaldoInputSchema.parse(data);
    const existing = await this.motivoBloqueioSaldoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Motivo de bloqueio "${id}" não encontrado`);
    }

    const updated = await this.motivoBloqueioSaldoRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Motivo de bloqueio "${id}" não encontrado`);
    }

    return updated;
  }
}
