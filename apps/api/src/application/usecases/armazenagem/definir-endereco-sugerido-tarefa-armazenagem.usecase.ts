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
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';

export type DefinirEnderecoSugeridoTarefaArmazenagemInput = {
  demandaId: string;
  tarefaId: string;
  enderecoSugeridoId: string;
};

@Injectable()
export class DefinirEnderecoSugeridoTarefaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({
    demandaId,
    tarefaId,
    enderecoSugeridoId,
  }: DefinirEnderecoSugeridoTarefaArmazenagemInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda não está disponível para alteração');
    }

    const tarefa =
      demanda.tarefas?.find((entry) => entry.id === tarefaId) ??
      (await this.armazenagemRepository.findTarefaById(tarefaId));

    if (!tarefa || tarefa.demandaId !== demandaId) {
      throw new NotFoundException(`Tarefa "${tarefaId}" não encontrada na demanda`);
    }

    if (tarefa.status === 'armazenada') {
      throw new BadRequestException('Palete já armazenado não pode ser alterado');
    }

    const endereco = await this.enderecoRepository.findById(enderecoSugeridoId);

    if (!endereco) {
      throw new NotFoundException(
        `Endereço "${enderecoSugeridoId}" não encontrado`,
      );
    }

    if (endereco.unidadeId !== demanda.unidadeId) {
      throw new BadRequestException(
        'Endereço informado não pertence à unidade da demanda',
      );
    }

    if (endereco.status !== 'disponivel') {
      throw new BadRequestException('Endereço selecionado não está disponível');
    }

    const enderecosReservados =
      await this.armazenagemRepository.listEnderecosSugeridosReservados({
        unidadeId: demanda.unidadeId,
        excludeTarefaId: tarefaId,
      });

    if (enderecosReservados.includes(enderecoSugeridoId)) {
      throw new BadRequestException(
        'Endereço já foi selecionado para outro palete de armazenagem',
      );
    }

    const updated = await this.armazenagemRepository.updateEnderecoSugeridoTarefa(
      tarefaId,
      enderecoSugeridoId,
    );

    if (!updated) {
      throw new Error('Failed to update endereco sugerido da tarefa');
    }

    return updated;
  }
}
