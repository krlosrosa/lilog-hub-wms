import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ConfirmarItemArmazenagemInputSchema,
  type ConfirmarItemArmazenagemInput,
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

export type ConfirmarItemArmazenagemUseCaseInput = {
  demandaId: string;
  itemId: string;
  data: ConfirmarItemArmazenagemInput;
  operatorId: number | null;
};

@Injectable()
export class ConfirmarItemArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly armazenagemSaldoEventPublisher: ArmazenagemSaldoEventPublisher,
  ) {}

  async execute({
    demandaId,
    itemId,
    data,
    operatorId,
  }: ConfirmarItemArmazenagemUseCaseInput) {
    const parsed = ConfirmarItemArmazenagemInputSchema.parse(data);
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

    const item = demanda.itens.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item "${itemId}" não encontrado na demanda`);
    }

    if (item.status === 'armazenado') {
      throw new BadRequestException('Item já foi armazenado');
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
      item.enderecoSugeridoId !== null &&
      item.enderecoSugeridoId !== parsed.enderecoConfirmadoId;

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

    let unitizadorId = item.unitizadorId;

    if (unitizadorId && parsed.unitizadorCodigo) {
      const unitizador = await this.armazenagemRepository.findUnitizadorById(
        unitizadorId,
      );

      if (
        unitizador &&
        unitizador.codigo.trim().toUpperCase() !==
          parsed.unitizadorCodigo.trim().toUpperCase()
      ) {
        throw new BadRequestException(
          'unitizadorCodigo não confere com o palete vinculado ao item',
        );
      }
    }

    if (
      demanda.modoUnitizacao === 'gerar_etiqueta_na_armazenagem' &&
      !unitizadorId
    ) {
      if (!parsed.unitizadorCodigo) {
        throw new BadRequestException(
          'unitizadorCodigo é obrigatório para gerar etiqueta na armazenagem',
        );
      }

      const existing = await this.armazenagemRepository.findUnitizadorByCodigo(
        demanda.unidadeId,
        parsed.unitizadorCodigo,
      );

      if (existing) {
        const podeReutilizar =
          existing.recebimentoId === demanda.recebimentoId &&
          (existing.status === 'aguardando_armazenagem' ||
            existing.status === 'armazenado');

        if (!podeReutilizar) {
          throw new BadRequestException(
            `Unitizador "${parsed.unitizadorCodigo}" já existe`,
          );
        }

        unitizadorId = existing.id;

        if (existing.enderecoAtualId !== parsed.enderecoConfirmadoId) {
          await this.armazenagemRepository.updateUnitizadorStatus(
            existing.id,
            existing.status,
            { enderecoAtualId: parsed.enderecoConfirmadoId },
          );
        }
      } else {
        const created = await this.armazenagemRepository.criarUnitizador({
          unidadeId: demanda.unidadeId,
          codigo: parsed.unitizadorCodigo,
          tipo: 'palete',
          origem: 'gerado_sistema',
          status: 'armazenado',
          recebimentoId: demanda.recebimentoId,
          enderecoAtualId: parsed.enderecoConfirmadoId,
        });

        unitizadorId = created.id;
      }
    }

    const quantidadeTransfer = item.quantidade;

    const updatedItem = await this.armazenagemRepository.updateStatusItem(
      itemId,
      'armazenado',
      parsed.enderecoConfirmadoId,
      unitizadorId ?? undefined,
      quantidadeTransfer,
    );

    if (!updatedItem) {
      throw new Error('Failed to update item armazenagem');
    }

    await this.armazenagemSaldoEventPublisher.publishProcessarSaldoItem({
      unidadeId: demanda.unidadeId,
      itemId,
      enderecoConfirmadoId: parsed.enderecoConfirmadoId,
      operatorId,
    });

    if (unitizadorId) {
      await this.armazenagemRepository.updateUnitizadorStatus(
        unitizadorId,
        'armazenado',
        { enderecoAtualId: parsed.enderecoConfirmadoId },
      );
    }

    const demandaAtualizada =
      await this.armazenagemRepository.findDemandaById(demandaId);

    const todosArmazenados =
      demandaAtualizada?.itens.every((entry) => entry.status === 'armazenado') ??
      false;

    if (todosArmazenados) {
      await this.armazenagemRepository.updateStatusDemanda(demandaId, 'concluida', {
        finishedAt: new Date(),
      });
    }

    return updatedItem;
  }
}
