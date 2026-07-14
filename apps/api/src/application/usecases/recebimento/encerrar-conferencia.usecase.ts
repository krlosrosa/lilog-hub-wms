import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import { TemperaturaProdutoEtapaSchema } from '../../../domain/model/recebimento/recebimento.model.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
  type ProdutoRecord,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { calcularDivergencias } from '../../../domain/services/recebimento-divergencia.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type EncerrarConferenciaUseCaseInput = {
  recebimentoId: string;
  userId: number | null;
  quantidadePaletes?: number;
};

@Injectable()
export class EncerrarConferenciaUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({
    recebimentoId,
    userId,
    quantidadePaletes,
  }: EncerrarConferenciaUseCaseInput) {
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
        'Conferência só pode ser encerrada com recebimento em andamento',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const itensRecebidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    if (itensRecebidos.length === 0) {
      throw new BadRequestException(
        'Não é possível encerrar conferência sem itens conferidos',
      );
    }

    const temperaturas =
      await this.conferenciaRepository.listTemperaturasProduto(recebimentoId);
    const etapasPreenchidas = new Set(temperaturas.map((item) => item.etapa));
    const etapasObrigatorias = TemperaturaProdutoEtapaSchema.options;
    const faltando = etapasObrigatorias.filter(
      (etapa) => !etapasPreenchidas.has(etapa),
    );

    if (faltando.length > 0) {
      throw new BadRequestException(
        'Informe as temperaturas de início, meio e fim do baú antes de encerrar a conferência.',
      );
    }

    if (
      quantidadePaletes !== undefined &&
      (!Number.isInteger(quantidadePaletes) || quantidadePaletes <= 0)
    ) {
      throw new BadRequestException(
        'Informe a quantidade de paletes recebidos (número inteiro maior que zero)',
      );
    }

    await this.recebimentoRepository.clearDivergencias(recebimentoId);

    const produtoIds = new Set([
      ...preRecebimento.itens.map((item) => item.produtoId),
      ...itensRecebidos.map((item) => item.produtoId),
    ]);

    const produtos = new Map<string, ProdutoRecord>(
      (
        await Promise.all(
          [...produtoIds].map(async (produtoId) => {
            const produto =
              await this.produtoRepository.findByProdutoId(produtoId);
            return produto ? ([produtoId, produto] as const) : null;
          }),
        )
      ).filter((entry): entry is readonly [string, ProdutoRecord] => entry !== null),
    );

    const divergenciasCalculadas = calcularDivergencias(
      preRecebimento.itens,
      itensRecebidos,
      produtos,
    );

    for (const divergencia of divergenciasCalculadas) {
      await this.recebimentoRepository.createDivergencia({
        recebimentoId,
        ...divergencia,
      });

      await this.recebimentoEventPublisher.publish({
        type: RECEBIMENTO_EVENT.DIVERGENCIA_IDENTIFICADA,
        preRecebimentoId: preRecebimento.id,
        recebimentoId,
        unidadeId: preRecebimento.unidadeId,
        userId,
        metadata: {
          tipoDivergencia: divergencia.tipoDivergencia,
          produtoId: divergencia.produtoId ?? null,
        },
      });
    }

    const dataFim = new Date();
    const novaSituacao = 'conferido' as const;

    const updated = await this.recebimentoRepository.updateStatus(
      recebimentoId,
      novaSituacao,
      dataFim,
      quantidadePaletes,
    );

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimento.id,
      novaSituacao,
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_CONFERIDO,
      preRecebimentoId: preRecebimento.id,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        divergenciasCount: divergenciasCalculadas.length,
      },
    });

    const details = await this.recebimentoRepository.findById(recebimentoId);

    return details ?? updated;
  }
}
