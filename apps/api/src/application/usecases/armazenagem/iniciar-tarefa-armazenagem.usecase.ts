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

export type IniciarTarefaArmazenagemUseCaseInput = {
  demandaId: string;
  tarefaId: string;
  operatorId: number | null;
};

@Injectable()
export class IniciarTarefaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute({
    demandaId,
    tarefaId,
    operatorId,
  }: IniciarTarefaArmazenagemUseCaseInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda não está disponível para armazenagem');
    }

    const tarefa =
      demanda.tarefas?.find((entry) => entry.id === tarefaId) ??
      (await this.armazenagemRepository.findTarefaById(tarefaId));

    if (!tarefa || tarefa.demandaId !== demandaId) {
      throw new NotFoundException(`Tarefa "${tarefaId}" não encontrada na demanda`);
    }

    if (tarefa.status === 'armazenada') {
      throw new BadRequestException('Palete já foi armazenado');
    }

    if (demanda.status === 'aguardando_inicio') {
      await this.armazenagemRepository.updateStatusDemanda(demandaId, 'em_andamento', {
        responsavelId: operatorId ?? undefined,
        startedAt: new Date(),
      });
    }

    const updated = await this.armazenagemRepository.updateStatusTarefa(
      tarefaId,
      'em_andamento',
      {
        responsavelId: operatorId ?? undefined,
        startedAt: new Date(),
      },
    );

    if (!updated) {
      throw new Error('Failed to update tarefa armazenagem');
    }

    for (const item of tarefa.itens) {
      if (item.status === 'pendente') {
        await this.armazenagemRepository.updateStatusItem(
          item.id,
          'em_andamento',
        );
      }
    }

    return updated;
  }
}
