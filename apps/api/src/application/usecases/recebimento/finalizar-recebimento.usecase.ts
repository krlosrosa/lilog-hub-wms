import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  ParametrosRecebimentoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  montarDescricaoCnc,
  montarItensCncRecebimento,
} from '../../../domain/services/montar-itens-cnc-recebimento.js';
import { resolveDisplayQuantidadeConfig } from '../../../domain/services/unidade-medida.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
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
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';

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
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
    private readonly cncEventPublisher: CncEventPublisher,
  ) {}

  async execute({ recebimentoId, userId }: FinalizarRecebimentoUseCaseInput) {
    await this.recebimentoParticipacaoService.assertResponsavelForRecebimento(
      recebimentoId,
      userId,
    );

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao === 'finalizado') {
      throw new BadRequestException('Recebimento já está finalizado');
    }

    if (recebimento.situacao !== 'conferido') {
      throw new BadRequestException(
        'Finalização só é permitida para recebimentos conferidos',
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
    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    const updated = await this.recebimentoRepository.updateStatus(
      recebimentoId,
      'finalizado',
    );

    await this.preRecebimentoRepository.updateSituacao(
      preRecebimento.id,
      'finalizado',
    );

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_FINALIZADO,
      preRecebimentoId: preRecebimento.id,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
    });

    const produtoIdsCnc = new Set<string>([
      ...preRecebimento.itens.map((item) => item.produtoId),
      ...itensConferidos.map((item) => item.produtoId),
      ...avarias.flatMap((avaria) =>
        avaria.produtoId ? [avaria.produtoId] : [],
      ),
    ]);

    const produtosCnc = new Map(
      (
        await Promise.all(
          [...produtoIdsCnc].map((produtoId) =>
            this.produtoRepository.findByProdutoId(produtoId),
          ),
        )
      )
        .filter((produto) => produto !== null)
        .map((produto) => [produto!.produtoId, produto!]),
    );

    const displayConfig = await this.resolveDisplayConfig(
      preRecebimento.unidadeId,
    );

    const itensCnc = montarItensCncRecebimento({
      recebimentoId,
      itensEsperados: preRecebimento.itens,
      itensRecebidos: itensConferidos,
      avarias,
      produtos: produtosCnc,
      displayConfig,
    });

    if (itensCnc.length > 0) {
      await this.cncEventPublisher.publish({
        recebimentoId,
        preRecebimentoId: preRecebimento.id,
        unidadeId: preRecebimento.unidadeId,
        transportadoraId: preRecebimento.transportadoraNome ?? '',
        responsavelOperacaoId: recebimento.responsavelId,
        userId,
        descricao: montarDescricaoCnc(itensCnc),
        itens: itensCnc,
      });
    }

    return updated;
  }

  private async resolveDisplayConfig(unidadeId: string) {
    const configuracoes = await this.configuracaoOperacionalRepository.list({
      unidadeId,
      dominio: DOMINIO_RECEBIMENTO,
      categoria: CATEGORIA_CONFERENCIA,
      subtipo: SUBTIPO_PARAMETROS,
      ativo: true,
    });

    const configPadrao =
      configuracoes.find((item) => item.isPadrao) ?? configuracoes[0];
    const parametros = ParametrosRecebimentoConferenciaSchema.parse(
      configPadrao?.parametros ?? {},
    );

    return resolveDisplayQuantidadeConfig(parametros);
  }
}
