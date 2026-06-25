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

export type IniciarDemandaArmazenagemInput = {
  demandaId: string;
  responsavelId: number;
};

@Injectable()
export class IniciarDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute({ demandaId, responsavelId }: IniciarDemandaArmazenagemInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida') {
      throw new BadRequestException('Demanda já está concluída');
    }

    if (demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda cancelada não pode ser iniciada');
    }

    if (demanda.status === 'em_andamento') {
      return demanda;
    }

    const updated = await this.armazenagemRepository.updateStatusDemanda(
      demandaId,
      'em_andamento',
      {
        responsavelId,
        startedAt: new Date(),
      },
    );

    if (!updated) {
      throw new Error('Failed to update demanda armazenagem');
    }

    return {
      ...demanda,
      ...updated,
    };
  }
}
