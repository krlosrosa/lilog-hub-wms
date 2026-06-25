import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreatePreRecebimentoInputSchema,
  type CreatePreRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';
import { RegistrarSaldoRecebimentoProvisorioUseCase } from '../estoque/registrar-saldo-recebimento-provisorio.usecase.js';

export type CreatePreRecebimentoUseCaseInput = {
  data: CreatePreRecebimentoInput;
  userId: number | null;
};

@Injectable()
export class CreatePreRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
    private readonly registrarSaldoRecebimentoProvisorioUseCase: RegistrarSaldoRecebimentoProvisorioUseCase,
  ) {}

  async execute({ data, userId }: CreatePreRecebimentoUseCaseInput) {
    const parsed = CreatePreRecebimentoInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    if (!parsed.transportadoraId.trim()) {
      throw new BadRequestException('Transportadora é obrigatória');
    }

    if (!parsed.placa.trim()) {
      throw new BadRequestException('Placa é obrigatória');
    }

    for (const item of parsed.itens) {
      const produto = await this.produtoRepository.findById(item.produtoId);

      if (!produto) {
        throw new NotFoundException(
          `Produto "${item.produtoId}" não encontrado`,
        );
      }
    }

    const created = await this.preRecebimentoRepository.create(parsed, userId);

    try {
      await this.registrarSaldoRecebimentoProvisorioUseCase.execute({
        unidadeId: created.unidadeId,
        preRecebimentoId: created.id,
        itensEsperados: created.itens,
        operatorId: userId,
      });
    } catch (error) {
      await this.preRecebimentoRepository.cancel(created.id);
      throw error;
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.PRE_RECEBIMENTO_CRIADO,
      preRecebimentoId: created.id,
      unidadeId: created.unidadeId,
      userId,
    });

    return created;
  }
}
