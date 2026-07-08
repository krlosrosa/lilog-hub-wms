import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ConfirmarTarefaArmazenagemInputSchema,
  type ConfirmarTarefaArmazenagemInput,
} from '../../../domain/model/armazenagem/armazenagem.model.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import { ArmazenagemSaldoEventPublisher } from '../../services/armazenagem/armazenagem-saldo-event.publisher.js';

export type ConfirmarTarefaArmazenagemUseCaseInput = {
  demandaId: string;
  tarefaId: string;
  data: ConfirmarTarefaArmazenagemInput;
  operatorId: number | null;
};

@Injectable()
export class ConfirmarTarefaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly armazenagemSaldoEventPublisher: ArmazenagemSaldoEventPublisher,
  ) {}

  async execute({
    demandaId,
    tarefaId,
    data,
    operatorId,
  }: ConfirmarTarefaArmazenagemUseCaseInput) {
    const parsed = ConfirmarTarefaArmazenagemInputSchema.parse(data);
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda não está disponível para armazenagem');
    }

    if (demanda.status === 'aguardando_validacao') {
      throw new BadRequestException('Endereço ainda não validado pelo ADM');
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

    const endereco = await this.enderecoRepository.findById(
      parsed.enderecoConfirmadoId,
    );

    if (!endereco) {
      throw new NotFoundException(
        `Endereço "${parsed.enderecoConfirmadoId}" não encontrado`,
      );
    }

    if (endereco.unidadeId !== demanda.unidadeId) {
      throw new BadRequestException(
        'Endereço informado não pertence à unidade da demanda',
      );
    }

    const politica = await this.armazenagemRepository.getPoliticaArmazenagem(
      demanda.unidadeId,
    );

    const enderecosDivergem =
      tarefa.enderecoSugeridoId !== null &&
      tarefa.enderecoSugeridoId !== parsed.enderecoConfirmadoId;

    if (enderecosDivergem) {
      if (politica.enderecoDivergente === 'bloquear') {
        throw new BadRequestException(
          'Endereço confirmado difere do sugerido. A política da unidade não permite divergência.',
        );
      }

      if (
        politica.enderecoDivergente === 'permitir_com_motivo' &&
        !parsed.motivoDivergencia
      ) {
        throw new BadRequestException(
          'Informe o motivo da divergência de endereço (motivoDivergencia).',
        );
      }
    }

    let unitizadorId = tarefa.unitizadorId;

    if (parsed.unitizadorCodigo) {
      const existing = await this.armazenagemRepository.findUnitizadorByCodigo(
        demanda.unidadeId,
        parsed.unitizadorCodigo,
      );

      if (!existing) {
        throw new BadRequestException(
          `Unitizador "${parsed.unitizadorCodigo}" não encontrado`,
        );
      }

      if (tarefa.unitizadorId && existing.id !== tarefa.unitizadorId) {
        throw new BadRequestException(
          'unitizadorCodigo não confere com o palete designado para a tarefa',
        );
      }

      unitizadorId = existing.id;
    }

    if (unitizadorId) {
      await this.armazenagemRepository.updateUnitizadorStatus(
        unitizadorId,
        'armazenado',
        { enderecoAtualId: parsed.enderecoConfirmadoId },
      );
    }

    for (const item of tarefa.itens) {
      await this.armazenagemRepository.updateStatusItem(
        item.id,
        'armazenado',
        parsed.enderecoConfirmadoId,
        unitizadorId ?? undefined,
        item.quantidade,
      );
    }

    const updatedTarefa = await this.armazenagemRepository.updateStatusTarefa(
      tarefaId,
      'armazenada',
      {
        finishedAt: new Date(),
        enderecoConfirmadoId: parsed.enderecoConfirmadoId,
      },
    );

    if (!updatedTarefa) {
      throw new Error('Failed to update tarefa armazenagem');
    }

    await this.armazenagemSaldoEventPublisher.publishProcessarSaldoTarefa({
      unidadeId: demanda.unidadeId,
      tarefaId,
      enderecoConfirmadoId: parsed.enderecoConfirmadoId,
      operatorId,
    });

    const demandaAtualizada =
      await this.armazenagemRepository.findDemandaById(demandaId);

    const tarefas = demandaAtualizada?.tarefas ?? [];
    const todosArmazenados =
      tarefas.length > 0
        ? tarefas.every((entry) => entry.status === 'armazenada')
        : (demandaAtualizada?.itens.every(
            (entry) => entry.status === 'armazenado',
          ) ?? false);

    if (todosArmazenados) {
      await this.armazenagemRepository.updateStatusDemanda(demandaId, 'concluida', {
        finishedAt: new Date(),
      });
    }

    return updatedTarefa;
  }
}
