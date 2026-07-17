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
import {
  ConferirItemInputSchema,
  type ConferirItemInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
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
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import type { ProdutoConferenciaConfig } from '../../../domain/services/recebimento-produto-rules.js';
import {
  resolveProdutoConferenciaConfig,
  validateConferirItemFields,
} from '../../../domain/services/recebimento-produto-rules.js';
import { toBaseUnits } from '../../../domain/services/unidade-medida.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';
import { EtiquetaPesagemDuplicadaError } from '../../../infra/db/recebimento/create-pesagem-recebimento.drizzle.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';

export type ConferirItemUseCaseInput = {
  recebimentoId: string;
  data: ConferirItemInput;
  userId: number | null;
  clientConferenceId?: string;
};

function applyParametrosToItemConfig(
  config: ProdutoConferenciaConfig,
  solicitarPesoPvar: boolean,
  exigirEtiquetaPesoVariavel: boolean,
): ProdutoConferenciaConfig {
  if (!solicitarPesoPvar) {
    return {
      ...config,
      controlaPeso: false,
      pesoVariavel: false,
      exigirEtiquetaPesoVariavel: false,
    };
  }

  return {
    ...config,
    exigirEtiquetaPesoVariavel:
      config.pesoVariavel && exigirEtiquetaPesoVariavel,
  };
}

@Injectable()
export class ConferirItemUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
  ) {}

  private async resolveConferidoPorId(userId: number | null): Promise<number | null> {
    if (userId == null) {
      return null;
    }

    const user = await this.userRepository.findById(userId);
    return user?.funcionarioId ?? null;
  }

  async execute({ recebimentoId, data, userId, clientConferenceId }: ConferirItemUseCaseInput) {
    const parsed = ConferirItemInputSchema.parse(data);

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(`Recebimento "${recebimentoId}" não encontrado`);
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Conferência só é permitida com recebimento em andamento',
      );
    }

    await this.recebimentoParticipacaoService.assertResponsavelOuApoioForRecebimento(
      recebimentoId,
      userId,
    );

    const produto = await this.produtoRepository.findByProdutoId(parsed.produtoId);

    if (!produto) {
      throw new NotFoundException(`Produto "${parsed.produtoId}" não encontrado`);
    }

    const preRecebimento = await this.preRecebimentoRepository.findById(
      recebimento.preRecebimentoId,
    );

    if (!preRecebimento) {
      throw new NotFoundException('Pré-recebimento vinculado não encontrado');
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

    const config = applyParametrosToItemConfig(
      resolveProdutoConferenciaConfig(
        produto,
        parametrosConferencia.solicitarPesoPvar,
        parametrosConferencia.exigirEtiquetaPesoVariavel,
      ),
      parametrosConferencia.solicitarPesoPvar,
      parametrosConferencia.exigirEtiquetaPesoVariavel,
    );

    const validationErrors = validateConferirItemFields(
      parsed,
      config,
      parametrosConferencia.loteModo,
    );

    if (validationErrors.length > 0) {
      throw new BadRequestException(validationErrors.join('; '));
    }

    const etiquetaNormalizada = parsed.etiquetaCodigo?.trim();
    if (etiquetaNormalizada) {
      const existing = await this.recebimentoRepository.findPesagemByEtiqueta(
        preRecebimento.unidadeId,
        etiquetaNormalizada,
      );

      if (existing) {
        throw new BadRequestException(
          `Etiqueta "${etiquetaNormalizada}" já está em uso nesta unidade`,
        );
      }
    }

    let unitizadorId: string | null = null;
    const requiresUnitizador =
      parametrosConferencia.controlaPalete || config.pesoVariavel;

    if (requiresUnitizador) {
      if (!parsed.unitizadorCodigo) {
        throw new BadRequestException(
          'unitizadorCodigo é obrigatório para este tipo de conferência',
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
        'unitizadorCodigo não é permitido quando o controle de palete está desativado',
      );
    }

    if (
      !config.pesoVariavel &&
      parsed.pesoRecebido === undefined &&
      produto.pesoBrutoUnidade
    ) {
      const quantidadeEmUN = toBaseUnits(
        parsed.quantidadeRecebida,
        parsed.unidadeMedida,
        produto.unidadesPorCaixa ?? 1,
      );
      parsed.pesoRecebido =
        quantidadeEmUN * Number(produto.pesoBrutoUnidade);
    }

    let result;

    const conferidoPorId = await this.resolveConferidoPorId(userId);

    try {
      result = await this.recebimentoRepository.addItem(
        recebimentoId,
        preRecebimento.unidadeId,
        parsed,
        {
          unitizadorId,
          pesoVariavel: config.pesoVariavel,
          conferidoPorId,
          clientConferenceId: clientConferenceId?.trim() || null,
        },
      );
    } catch (error) {
      if (error instanceof EtiquetaPesagemDuplicadaError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const { item, pesagem } = result;

    await this.recebimentoEventPublisher.publish({
      type: RECEBIMENTO_EVENT.ITEM_CONFERIDO,
      preRecebimentoId: recebimento.preRecebimentoId,
      recebimentoId: recebimento.id,
      unidadeId: preRecebimento.unidadeId,
      userId,
      metadata: {
        produtoId: parsed.produtoId,
        quantidadeRecebida: parsed.quantidadeRecebida,
        pesoRecebido: parsed.pesoRecebido,
        etiquetaCodigo: parsed.etiquetaCodigo,
        pesagemId: pesagem?.id,
      },
    });

    return {
      id: item.id,
      produtoId: item.produtoId,
      quantidadeRecebida: item.quantidadeRecebida,
      unidadeMedida: item.unidadeMedida,
      pesoRecebido: pesagem?.pesoKg ?? item.pesoRecebido,
      etiquetaCodigo: pesagem?.etiquetaCodigo ?? null,
      pesagemId: pesagem?.id ?? null,
    };
  }
}
