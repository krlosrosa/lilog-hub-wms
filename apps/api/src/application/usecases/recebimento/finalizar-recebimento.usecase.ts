import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';
import { DistribuirSaldoRecebimentoFinalizadoUseCase } from '../estoque/distribuir-saldo-recebimento-finalizado.usecase.js';
import { GerarDemandaArmazenagemUseCase } from '../armazenagem/gerar-demanda-armazenagem.usecase.js';

export type FinalizarRecebimentoUseCaseInput = {
  recebimentoId: string;
  userId: number | null;
};

@Injectable()
export class FinalizarRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly avariaRepository: IRecebimentoAvariaRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
    private readonly cncEventPublisher: CncEventPublisher,
    private readonly distribuirSaldoRecebimentoFinalizadoUseCase: DistribuirSaldoRecebimentoFinalizadoUseCase,
    private readonly gerarDemandaArmazenagemUseCase: GerarDemandaArmazenagemUseCase,
  ) {}

  async execute({ recebimentoId, userId }: FinalizarRecebimentoUseCaseInput) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao === 'finalizado') {
      throw new BadRequestException('Recebimento já está finalizado');
    }

    if (recebimento.situacao !== 'aprovado') {
      throw new BadRequestException(
        'Finalização só é permitida para recebimentos aprovados',
      );
    }

    if (!recebimento.dataFim) {
      throw new BadRequestException(
        'Conferência deve ser encerrada antes da finalização',
      );
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
    }

    const avarias = await this.avariaRepository.listByRecebimento(recebimentoId);
    const divergencias = recebimento.divergencias;

    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    const distribuicao =
      await this.distribuirSaldoRecebimentoFinalizadoUseCase.execute({
        unidadeId: preRecebimento.unidadeId,
        preRecebimentoId: preRecebimento.id,
        itensEsperados: preRecebimento.itens,
        itensConferidos,
        divergencias,
        avarias,
        operatorId: userId,
      });

    const demanda = await this.gerarDemandaArmazenagemUseCase.execute({
      unidadeId: preRecebimento.unidadeId,
      recebimentoId,
      modoUnitizacao: recebimento.modoUnitizacao,
      itens: distribuicao.itensAguardandoArmazenagem,
    });

    const updated = await this.recebimentoRepository.updateStatus(
      recebimentoId,
      'finalizado',
    );

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimento.id,
      'finalizado',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.TAREFA_ARMAZENAGEM_GERADA,
      preRecebimentoId: preRecebimento.id,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        demandaId: demanda?.id ?? null,
        itens: distribuicao.itensAguardandoArmazenagem.map((item) => ({
          unitizadorId: item.unitizadorId,
          produtoId: item.produtoId,
          quantidadeRecebida: item.quantidade,
          unidadeMedida: item.unidadeMedida,
          loteRecebido: item.lote,
          validade: item.validade,
          numeroSerie: item.numeroSerie,
        })),
      },
    });

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_FINALIZADO,
      preRecebimentoId: preRecebimento.id,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
    });

    if (divergencias.length > 0 || avarias.length > 0) {
      await this.cncEventPublisher.publish({
        recebimentoId,
        preRecebimentoId: preRecebimento.id,
        unidadeId: preRecebimento.unidadeId,
        transportadoraId: preRecebimento.transportadoraId,
        responsavelOperacaoId: recebimento.responsavelId,
        userId,
        divergencias: divergencias.map((divergencia) => ({
          id: divergencia.id,
          tipo: divergencia.tipoDivergencia,
          produtoId: divergencia.produtoId,
        })),
        avarias: avarias.map((avaria) => ({
          id: avaria.id,
          natureza: avaria.natureza,
          produtoId: avaria.produtoId,
        })),
      });
    }

    return updated;
  }
}
