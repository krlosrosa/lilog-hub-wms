import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UpdatePreRecebimentoInputSchema,
  canEditPreRecebimento,
  type UpdatePreRecebimentoInput,
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
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';
import { EstornarSaldoRecebimentoUseCase } from '../estoque/estornar-saldo-recebimento.usecase.js';
import { RegistrarSaldoRecebimentoProvisorioUseCase } from '../estoque/registrar-saldo-recebimento-provisorio.usecase.js';

export type UpdatePreRecebimentoUseCaseInput = {
  id: string;
  data: UpdatePreRecebimentoInput;
  userId: number | null;
};

@Injectable()
export class UpdatePreRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
    private readonly estornarSaldoRecebimentoUseCase: EstornarSaldoRecebimentoUseCase,
    private readonly registrarSaldoRecebimentoProvisorioUseCase: RegistrarSaldoRecebimentoProvisorioUseCase,
  ) {}

  async execute({ id, data, userId }: UpdatePreRecebimentoUseCaseInput) {
    const parsed = UpdatePreRecebimentoInputSchema.parse(data);
    const existing = await this.preRecebimentoRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (!canEditPreRecebimento(existing.situacao)) {
      throw new BadRequestException(
        'Pré-recebimento não pode ser alterado na situação atual',
      );
    }

    if (parsed.itens) {
      for (const item of parsed.itens) {
        const produto = await this.produtoRepository.findById(item.produtoId);

        if (!produto) {
          throw new NotFoundException(
            `Produto "${item.produtoId}" não encontrado`,
          );
        }
      }
    }

    const updated = await this.preRecebimentoRepository.update(id, parsed);

    if (!updated) {
      throw new NotFoundException(`Pré-recebimento "${id}" não encontrado`);
    }

    if (parsed.itens) {
      await this.estornarSaldoRecebimentoUseCase.execute({
        unidadeId: updated.unidadeId,
        preRecebimentoId: updated.id,
        operatorId: userId,
      });

      await this.registrarSaldoRecebimentoProvisorioUseCase.execute({
        unidadeId: updated.unidadeId,
        preRecebimentoId: updated.id,
        itensEsperados: updated.itens,
        operatorId: userId,
      });
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.PRE_RECEBIMENTO_ATUALIZADO,
      preRecebimentoId: updated.id,
      unidadeId: updated.unidadeId,
      userId,
    });

    return updated;
  }
}
