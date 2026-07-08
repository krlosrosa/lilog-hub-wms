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

export type ValidarDemandaArmazenagemUseCaseInput = {
  demandaId: string;
  userId: number | null;
};

@Injectable()
export class ValidarDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute({ demandaId, userId }: ValidarDemandaArmazenagemUseCaseInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status !== 'aguardando_validacao') {
      throw new BadRequestException(
        'Demanda não está aguardando validação do ADM',
      );
    }

    const tarefas = demanda.tarefas ?? [];
    const entidadesEndereco =
      tarefas.length > 0
        ? tarefas.map((tarefa) => ({
            id: tarefa.id,
            enderecoSugeridoId: tarefa.enderecoSugeridoId,
            label: `tarefa ${tarefa.sequencia}`,
          }))
        : demanda.itens.map((item) => ({
            id: item.id,
            enderecoSugeridoId: item.enderecoSugeridoId,
            label: `item ${item.produtoSku ?? item.produtoId}`,
          }));

    const semEndereco = entidadesEndereco.filter(
      (entry) => !entry.enderecoSugeridoId,
    );

    if (semEndereco.length > 0) {
      throw new BadRequestException(
        'Defina o endereço sugerido para todos os paletes antes de validar',
      );
    }

    const unitizadorIds = [
      ...new Set(
        [
          ...demanda.itens.map((item) => item.unitizadorId),
          ...tarefas.map((tarefa) => tarefa.unitizadorId),
        ].filter((id): id is string => id !== null),
      ),
    ];

    await Promise.all(
      unitizadorIds.map((unitizadorId) =>
        this.armazenagemRepository.updateUnitizadorStatus(
          unitizadorId,
          'aguardando_armazenagem',
        ),
      ),
    );

    await this.armazenagemRepository.updateStatusDemanda(
      demandaId,
      'aguardando_inicio',
      {
        validadoPor: userId ?? undefined,
        validadoEm: new Date(),
      },
    );

    const refreshed = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!refreshed) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    return refreshed;
  }
}
