import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type RemoverPaleteConferenciaRecebimentoUseCaseInput = {
  recebimentoId: string;
  unitizadorCodigo: string;
  produtoId?: string;
  userId: number | null;
};

@Injectable()
export class RemoverPaleteConferenciaRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({
    recebimentoId,
    unitizadorCodigo,
    produtoId,
    userId,
  }: RemoverPaleteConferenciaRecebimentoUseCaseInput) {
    await this.recebimentoParticipacaoService.assertResponsavelForRecebimento(
      recebimentoId,
      userId,
    );

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Remoção de conferência só é permitida com recebimento em andamento',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const unitizador = await this.armazenagemRepository.findUnitizadorByCodigo(
      preRecebimento.unidadeId,
      unitizadorCodigo,
    );

    if (!unitizador) {
      throw new NotFoundException(
        `Palete "${unitizadorCodigo}" não encontrado nesta unidade`,
      );
    }

    const result =
      await this.recebimentoRepository.removeItensConferenciaByUnitizador(
        recebimentoId,
        unitizador.id,
        produtoId,
      );

    if (result.removedCount === 0) {
      throw new NotFoundException(
        `Nenhuma linha de conferência encontrada para o palete "${unitizadorCodigo}"`,
      );
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.ITEM_CONFERIDO,
      preRecebimentoId: recebimento.preRecebimentoId,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        unitizadorCodigo,
        unitizadorId: unitizador.id,
        produtoId,
        removed: true,
        removedCount: result.removedCount,
      },
    });

    return {
      unitizadorCodigo,
      unitizadorId: unitizador.id,
      removedCount: result.removedCount,
    };
  }
}
