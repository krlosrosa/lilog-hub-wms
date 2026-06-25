import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';

@Injectable()
export class ConcluirDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute(demandaId: string) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida') {
      return demanda;
    }

    const pendentes = demanda.itens.filter(
      (item) => item.status !== 'armazenado',
    );

    if (pendentes.length > 0) {
      throw new BadRequestException(
        'Todos os itens devem estar armazenados antes de concluir a demanda',
      );
    }

    const updated = await this.armazenagemRepository.updateStatusDemanda(
      demandaId,
      'concluida',
      { finishedAt: new Date() },
    );

    if (!updated) {
      throw new Error('Failed to conclude demanda armazenagem');
    }

    return {
      ...demanda,
      ...updated,
    };
  }
}
