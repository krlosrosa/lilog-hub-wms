import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ConferirItemInputSchema,
  type ConferirItemInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  resolveProdutoConferenciaConfig,
  validateConferirItemFields,
} from '../../../domain/services/recebimento-produto-rules.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type ConferirItemUseCaseInput = {
  recebimentoId: string;
  data: ConferirItemInput;
  userId: number | null;
};

@Injectable()
export class ConferirItemUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ recebimentoId, data, userId }: ConferirItemUseCaseInput) {
    const parsed = ConferirItemInputSchema.parse(data);
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'em_recebimento') {
      throw new BadRequestException(
        'Conferência só é permitida com recebimento em andamento',
      );
    }

    const produto = await this.produtoRepository.findById(parsed.produtoId);

    if (!produto) {
      throw new NotFoundException(`Produto "${parsed.produtoId}" não encontrado`);
    }

    const config = resolveProdutoConferenciaConfig(produto);
    const validationErrors = validateConferirItemFields(parsed, config);

    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join('; '));
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    let unitizadorId: string | null = null;

    if (recebimento.modoUnitizacao === 'bipar_palete_no_recebimento') {
      if (!parsed.unitizadorCodigo) {
        throw new BadRequestException(
          'unitizadorCodigo é obrigatório no modo bipar_palete_no_recebimento',
        );
      }

      const existing = await this.armazenagemRepository.findUnitizadorByCodigo(
        preRecebimento.unidadeId,
        parsed.unitizadorCodigo,
      );

      if (existing) {
        if (
          existing.recebimentoId &&
          existing.recebimentoId !== recebimentoId
        ) {
          throw new BadRequestException(
            `Unitizador "${parsed.unitizadorCodigo}" já está em uso em outro recebimento`,
          );
        }

        if (existing.status === 'cancelado') {
          throw new BadRequestException(
            `Unitizador "${parsed.unitizadorCodigo}" está cancelado`,
          );
        }

        unitizadorId = existing.id;

        if (existing.status === 'virgem') {
          await this.armazenagemRepository.updateUnitizadorStatus(
            existing.id,
            'em_recebimento',
            { recebimentoId },
          );
        } else if (!existing.recebimentoId) {
          await this.armazenagemRepository.updateUnitizadorStatus(
            existing.id,
            existing.status,
            { recebimentoId },
          );
        }
      } else {
        const created = await this.armazenagemRepository.criarUnitizador({
          unidadeId: preRecebimento.unidadeId,
          codigo: parsed.unitizadorCodigo,
          tipo: 'palete',
          origem: 'palete_virgem',
          status: 'em_recebimento',
          recebimentoId,
          enderecoAtualId: null,
        });
        unitizadorId = created.id;
      }
    } else if (parsed.unitizadorCodigo) {
      throw new BadRequestException(
        'unitizadorCodigo não é permitido no modo gerar_etiqueta_na_armazenagem',
      );
    }

    const item = await this.recebimentoRepository.addItem(
      recebimentoId,
      parsed,
      unitizadorId,
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.ITEM_CONFERIDO,
      preRecebimentoId: recebimento.preRecebimentoId,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        produtoId: parsed.produtoId,
        quantidadeRecebida: parsed.quantidadeRecebida,
      },
    });

    return {
      id: item.id,
      produtoId: item.produtoId,
      quantidadeRecebida: item.quantidadeRecebida,
      unidadeMedida: item.unidadeMedida,
    };
  }
}
