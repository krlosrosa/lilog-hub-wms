import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  IniciarRecebimentoInputSchema,
  type IniciarRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  ParametrosRecebimentoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type IniciarRecebimentoUseCaseInput = {
  data: IniciarRecebimentoInput;
  userId: number | null;
};

@Injectable()
export class IniciarRecebimentoUseCase {
  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  async execute({ data, userId }: IniciarRecebimentoUseCaseInput) {
    const parsed = IniciarRecebimentoInputSchema.parse(data);
    const preRecebimento = await this.preRecebimentoRepository.findById(
      parsed.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${parsed.preRecebimentoId}" não encontrado`,
      );
    }

    const existingRecebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(
        parsed.preRecebimentoId,
      );

    if (existingRecebimento) {
      throw new ConflictException('Recebimento já iniciado para esta carga');
    }

    const canIniciarRecebimento =
      preRecebimento.situacao === 'liberado_para_conferencia' ||
      preRecebimento.situacao === 'em_conferencia';

    if (!canIniciarRecebimento) {
      throw new BadRequestException(
        'Recebimento só pode ser iniciado após liberação para conferência',
      );
    }

    let alocacaoAtiva =
      await this.recebimentoAlocacaoRepository.findAtivaByPreRecebimentoId(
        parsed.preRecebimentoId,
      );

    if (alocacaoAtiva && alocacaoAtiva.funcionarioId !== parsed.responsavelId) {
      throw new ConflictException(
        'Esta demanda foi atribuída a outro conferente pelo líder. Solicite reatribuição.',
      );
    }

    if (
      !alocacaoAtiva &&
      preRecebimento.situacao === 'liberado_para_conferencia'
    ) {
      const vinculo =
        await this.sessaoOperacaoRepository.findSessaoFuncionarioRecebimentoAberta(
          preRecebimento.unidadeId,
          parsed.responsavelId,
        );

      if (vinculo) {
        try {
          await this.recebimentoAlocacaoRepository.criar({
            preRecebimentoId: parsed.preRecebimentoId,
            sessaoId: vinculo.sessaoId,
            sessaoFuncionarioId: vinculo.sessaoFuncionarioId,
            funcionarioId: vinculo.funcionarioId,
            atribuidoPorUserId: userId,
          });
        } catch {
          // Concorrência ou alocação criada em paralelo: revalida estado.
        }

        alocacaoAtiva =
          await this.recebimentoAlocacaoRepository.findAtivaByPreRecebimentoId(
            parsed.preRecebimentoId,
          );
      }
    }

    if (alocacaoAtiva && alocacaoAtiva.funcionarioId !== parsed.responsavelId) {
      throw new ConflictException(
        'Esta demanda foi atribuída a outro conferente pelo líder. Solicite reatribuição.',
      );
    }

    const responsavel = await this.funcionarioRepository.findById(
      parsed.responsavelId,
    );

    if (!responsavel) {
      throw new NotFoundException(
        `Funcionário "${parsed.responsavelId}" não encontrado`,
      );
    }

    const docaId = parsed.docaId ?? preRecebimento.docaId ?? undefined;

    if (docaId) {
      const doca = await this.docaRepository.findById(docaId);

      if (!doca) {
        throw new NotFoundException(`Doca "${docaId}" não encontrada`);
      }

      if (doca.unidadeId !== preRecebimento.unidadeId) {
        throw new BadRequestException(
          'Doca informada não pertence à unidade do pré-recebimento',
        );
      }
    }

    const unidade = await this.unidadeRepository.findById(preRecebimento.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${preRecebimento.unidadeId}" não encontrada`,
      );
    }

    const configuracoes = await this.configuracaoOperacionalRepository.list({
      unidadeId: preRecebimento.unidadeId,
      dominio: DOMINIO_RECEBIMENTO,
      categoria: CATEGORIA_CONFERENCIA,
      subtipo: SUBTIPO_PARAMETROS,
      ativo: true,
    });

    const configPadrao =
      configuracoes.find((item) => item.isPadrao) ?? configuracoes[0];
    const parametrosConferencia = ParametrosRecebimentoConferenciaSchema.parse(
      configPadrao?.parametros ?? {},
    );

    const modoUnitizacao = parametrosConferencia.controlaPalete
      ? 'bipar_palete_no_recebimento'
      : unidade.modoUnitizacaoRecebimento;

    const recebimento = await this.recebimentoRepository.create(
      { ...parsed, docaId },
      userId,
      modoUnitizacao,
    );

    if (preRecebimento.situacao === 'liberado_para_conferencia') {
      await this.preRecebimentoRepository.updateSituacao(
        parsed.preRecebimentoId,
        'em_conferencia',
      );
    }

    if (alocacaoAtiva) {
      await this.recebimentoAlocacaoRepository.marcarIniciada(
        parsed.preRecebimentoId,
      );
    }

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.RECEBIMENTO_INICIADO,
      preRecebimentoId: preRecebimento.id,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        responsavelId: parsed.responsavelId,
        docaId: docaId ?? null,
      },
    });

    return recebimento;
  }
}
