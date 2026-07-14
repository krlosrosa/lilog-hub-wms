import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TarefaArmazenagemInput } from '../../../domain/model/armazenagem/armazenagem.model.js';
import {
  DESTINOS_ESTOQUE_FISICO_ETIQUETAS,
  buildItensAguardandoArmazenagemDePaletesBipados,
  type ItemAguardandoArmazenagem,
} from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import { gerarCodigoUnitizadorPalete } from '../../../domain/services/gerar-codigo-unitizador-palete.js';
import {
  calcularCapacidadePaleteUN,
  calcularQtdPaletesSugerida,
} from '../../../domain/services/calcular-capacidade-palete.js';
import { buildTarefasFromItensBipados } from '../../../domain/services/build-tarefas-armazenagem-bipadas.js';
import { createAlocadorSaldoClassificado } from '../../../domain/services/alocar-itens-por-classificacao-saldo.js';
import type { AlocadorSaldoClassificado } from '../../../domain/services/alocar-itens-por-classificacao-saldo.js';
import { RECEBIMENTO_EVENT } from '../../../domain/model/recebimento/recebimento.events.js';
import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  ParametrosRecebimentoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import { classificarLinhasSaldoRecebimento } from '../../../domain/services/classificar-linhas-saldo-recebimento.js';
import { aplicarBloqueioAvariaNasLinhasSaldo } from '../../../domain/services/aplicar-bloqueio-avaria-linhas-saldo.js';
import {
  montarDescricaoCnc,
  montarItensCncRecebimento,
} from '../../../domain/services/montar-itens-cnc-recebimento.js';
import {
  buildUnidadesPorCaixaMap,
  resolveDisplayQuantidadeConfig,
} from '../../../domain/services/unidade-medida.js';
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
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import { CncEventPublisher } from '../../services/cnc-event.publisher.js';
import { RecebimentoEventPublisher } from '../../services/recebimento-event.publisher.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';
import { RecebimentoSaldoEventPublisher } from '../../services/recebimento-saldo-event.publisher.js';
import { MontarItensAguardandoArmazenagemRecebimentoService } from '../../services/recebimento/montar-itens-aguardando-armazenagem-recebimento.service.js';
import { MontarPaletesArmazenagemService } from '../../services/armazenagem/montar-paletes-armazenagem.service.js';
import { GerarDemandaArmazenagemUseCase } from '../armazenagem/gerar-demanda-armazenagem.usecase.js';

export type PaleteFinalizacaoInput = {
  produtoId: string;
  qtdPaletes?: number;
  sequencia?: number;
  quantidade?: number;
  enderecoSugeridoId?: string;
  codigoUnitizador?: string;
};

export type PaleteBipadoValidadoInput = {
  unitizadorId: string;
  enderecoSugeridoId: string;
};

export type FinalizarRecebimentoUseCaseInput = {
  recebimentoId: string;
  userId: number | null;
  paletes?: PaleteFinalizacaoInput[];
  paletesBipadosValidados?: PaleteBipadoValidadoInput[];
};

export type EtiquetaPaleteGerada = {
  unitizadorId: string;
  codigo: string;
  produtoId: string;
  sku: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: string | null;
  enderecoSugeridoLabel: string | null;
  numeroRecebimento: string;
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
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
    private readonly recebimentoEventPublisher: RecebimentoEventPublisher,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
    private readonly cncEventPublisher: CncEventPublisher,
    private readonly recebimentoSaldoEventPublisher: RecebimentoSaldoEventPublisher,
    private readonly montarItensAguardandoArmazenagemRecebimentoService: MontarItensAguardandoArmazenagemRecebimentoService,
    private readonly montarPaletesArmazenagemService: MontarPaletesArmazenagemService,
    private readonly gerarDemandaArmazenagemUseCase: GerarDemandaArmazenagemUseCase,
  ) {}

  async execute({
    recebimentoId,
    userId,
    paletes,
    paletesBipadosValidados,
  }: FinalizarRecebimentoUseCaseInput) {
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
    const divergencias = recebimento.divergencias;
    const itensConferidos =
      await this.recebimentoRepository.findItemsByRecebimento(recebimentoId);

    const itensAguardandoArmazenagem =
      await this.montarItensAguardandoArmazenagemRecebimentoService.execute({
        unidadeId: preRecebimento.unidadeId,
        itensConferidos,
        itensPreRecebimento: preRecebimento.itens,
        avarias,
        divergencias,
        recebimento,
        destinosElegiveis: DESTINOS_ESTOQUE_FISICO_ETIQUETAS,
      });

    const unidadesPorCaixaMap = buildUnidadesPorCaixaMap(preRecebimento.itens);
    const linhasSaldoClassificadas = aplicarBloqueioAvariaNasLinhasSaldo(
      classificarLinhasSaldoRecebimento({
        itensConferidos,
        divergencias,
        unidadesPorCaixaMap,
      }),
      avarias,
    );
    const alocadorSaldo = createAlocadorSaldoClassificado(
      linhasSaldoClassificadas,
    );

    const temPaletesBipadosNosConferidos = itensConferidos.some(
      (item) => item.unitizadorId !== null,
    );

    const usaFluxoPaleteBipado = temPaletesBipadosNosConferidos;

    const modoUnitizacaoDemanda = usaFluxoPaleteBipado
      ? 'bipar_palete_no_recebimento'
      : recebimento.modoUnitizacao;

    const numeroRecebimento =
      (await this.armazenagemRepository.resolveDocumentoRefByRecebimentoId(
        recebimentoId,
      )) ?? recebimentoId.slice(0, 8).toUpperCase();

    const paletesValidados = this.isPaletesValidados(paletes);

    let tarefas: TarefaArmazenagemInput[] = [];
    let etiquetas: EtiquetaPaleteGerada[] = [];
    let itensExpandidos: ItemAguardandoArmazenagem[] = itensAguardandoArmazenagem;
    let itensSemUnitizador: ItemAguardandoArmazenagem[] = [];
    let enderecosJaValidados = false;

    if (usaFluxoPaleteBipado && paletes && paletes.length > 0) {
      throw new BadRequestException(
        'Payload paletes não é permitido no modo bipar_palete_no_recebimento',
      );
    }

    let demanda: Awaited<
      ReturnType<GerarDemandaArmazenagemUseCase['execute']>
    > = null;

    try {
      if (usaFluxoPaleteBipado) {
        const itensBipados = buildItensAguardandoArmazenagemDePaletesBipados({
          itensConferidos,
          unidadesPorCaixaMap: buildUnidadesPorCaixaMap(preRecebimento.itens),
          avarias,
        });

        const built = buildTarefasFromItensBipados(itensBipados, alocadorSaldo);
        tarefas = built.tarefas;
        itensSemUnitizador = built.itensSemUnitizador;
        itensExpandidos = itensBipados;

        if (paletesBipadosValidados && paletesBipadosValidados.length > 0) {
          tarefas = await this.aplicarEnderecosValidadosEmTarefasBipadas({
            tarefas,
            paletesBipadosValidados,
            unidadeId: preRecebimento.unidadeId,
          });
          enderecosJaValidados = true;
        }
      } else if (paletesValidados && paletes) {
        const built = await this.buildTarefasFromPaletesValidados({
          paletes,
          itensAguardandoArmazenagem,
          unidadeId: preRecebimento.unidadeId,
          recebimentoId,
          numeroRecebimento,
          alocadorSaldo,
        });
        tarefas = built.tarefas;
        etiquetas = built.etiquetas;
        itensExpandidos = built.itensExpandidos;
      } else if (paletes && paletes.length > 0) {
        const paletesPorProduto = new Map(
          paletes
            .filter((item) => item.qtdPaletes)
            .map((item) => [item.produtoId, item.qtdPaletes!]),
        );

        const built = await this.buildTarefasFromQtdPaletes({
          itensAguardandoArmazenagem,
          paletesPorProduto,
          unidadeId: preRecebimento.unidadeId,
          recebimentoId,
          numeroRecebimento,
          alocadorSaldo,
        });
        tarefas = built.tarefas;
        etiquetas = built.etiquetas;
        itensExpandidos = built.itensExpandidos;
      } else if (itensAguardandoArmazenagem.length > 0) {
        const paletesPorProduto = await this.buildPaletesPorProdutoSugeridos(
          itensAguardandoArmazenagem,
        );

        if (paletesPorProduto.size > 0) {
          const built = await this.buildTarefasFromQtdPaletes({
            itensAguardandoArmazenagem,
            paletesPorProduto,
            unidadeId: preRecebimento.unidadeId,
            recebimentoId,
            numeroRecebimento,
            alocadorSaldo,
          });
          tarefas = built.tarefas;
          etiquetas = built.etiquetas;
          itensExpandidos = built.itensExpandidos;
        }
      }

      demanda = await this.gerarDemandaArmazenagemUseCase.execute({
        unidadeId: preRecebimento.unidadeId,
        recebimentoId,
        modoUnitizacao: modoUnitizacaoDemanda,
        tarefas: tarefas.length > 0 ? tarefas : undefined,
        itens:
          tarefas.length > 0
            ? itensSemUnitizador.length > 0
              ? itensSemUnitizador
              : undefined
            : itensExpandidos,
        enderecosJaValidados,
        pularSugestaoEndereco: true,
        userId,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      demanda = null;
      tarefas = [];
      etiquetas = [];
    }

    const etiquetasComEndereco = this.enriquecerEtiquetasComEndereco(
      etiquetas,
      demanda?.tarefas ?? [],
      demanda?.itens ?? [],
    );

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
        itens: itensExpandidos.map((item) => ({
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

    await this.recebimentoSaldoEventPublisher.publishProcessarSaldo({
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      userId,
      linhas: linhasSaldoClassificadas.map((linha) => ({
        produtoId: linha.produtoId,
        quantidade: linha.quantidade,
        unidadeMedida: linha.unidadeMedida,
        lote: linha.lote,
        validade: linha.validade?.toISOString() ?? null,
        numeroSerie: linha.numeroSerie,
        status: linha.status,
        tipoAnomalia: linha.tipoAnomalia,
      })),
    });

    if (divergencias.length > 0 || avarias.length > 0) {
      const produtoIds = new Set<string>();

      for (const divergencia of divergencias) {
        if (divergencia.produtoId) {
          produtoIds.add(divergencia.produtoId);
        }
      }

      for (const avaria of avarias) {
        if (avaria.produtoId) {
          produtoIds.add(avaria.produtoId);
        }
      }

      const produtos = new Map(
        (
          await Promise.all(
            [...produtoIds].map((produtoId) =>
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
        divergencias,
        avarias,
        itensEsperados: preRecebimento.itens,
        itensRecebidos: itensConferidos,
        produtos,
        displayConfig,
      });

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

    return {
      ...updated,
      etiquetas:
        etiquetasComEndereco.length > 0 ? etiquetasComEndereco : undefined,
    };
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

  private async aplicarEnderecosValidadosEmTarefasBipadas(input: {
    tarefas: TarefaArmazenagemInput[];
    paletesBipadosValidados: PaleteBipadoValidadoInput[];
    unidadeId: string;
  }): Promise<TarefaArmazenagemInput[]> {
    const enderecoPorUnitizador = new Map(
      input.paletesBipadosValidados.map((palete) => [
        palete.unitizadorId,
        palete.enderecoSugeridoId,
      ]),
    );

    if (input.tarefas.length === 0) {
      throw new BadRequestException(
        'Nenhuma tarefa de armazenagem encontrada para validar endereços',
      );
    }

    const tarefasAtualizadas: TarefaArmazenagemInput[] = [];

    for (const tarefa of input.tarefas) {
      if (!tarefa.unitizadorId) {
        throw new BadRequestException(
          'Tarefa de armazenagem sem unitizador vinculado',
        );
      }

      const enderecoSugeridoId = enderecoPorUnitizador.get(tarefa.unitizadorId);

      if (!enderecoSugeridoId) {
        throw new BadRequestException(
          `Endereço obrigatório para o palete "${tarefa.unitizadorId}"`,
        );
      }

      const endereco = await this.enderecoRepository.findById(enderecoSugeridoId);

      if (!endereco || endereco.unidadeId !== input.unidadeId) {
        throw new BadRequestException(
          `Endereço inválido para o palete "${tarefa.unitizadorId}"`,
        );
      }

      tarefasAtualizadas.push({
        ...tarefa,
        enderecoSugeridoId,
      });
    }

    return tarefasAtualizadas;
  }

  private isPaletesValidados(paletes?: PaleteFinalizacaoInput[]): boolean {
    return (
      paletes?.some(
        (palete) =>
          palete.enderecoSugeridoId !== undefined ||
          palete.sequencia !== undefined ||
          palete.quantidade !== undefined,
      ) ?? false
    );
  }

  private async buildTarefasFromPaletesValidados(input: {
    paletes: PaleteFinalizacaoInput[];
    itensAguardandoArmazenagem: ItemAguardandoArmazenagem[];
    unidadeId: string;
    recebimentoId: string;
    numeroRecebimento: string;
    alocadorSaldo: AlocadorSaldoClassificado;
  }) {
    const itensPorProduto = new Map(
      input.itensAguardandoArmazenagem.map((item) => [item.produtoId, item]),
    );

    const tarefas: TarefaArmazenagemInput[] = [];
    const etiquetas: EtiquetaPaleteGerada[] = [];
    const itensExpandidos: ItemAguardandoArmazenagem[] = [];

    for (const palete of input.paletes) {
      if (!palete.sequencia || !palete.quantidade) {
        throw new BadRequestException(
          'Paletes validados devem informar sequencia e quantidade',
        );
      }

      if (!palete.enderecoSugeridoId) {
        throw new BadRequestException(
          `Endereço sugerido obrigatório para palete ${palete.sequencia}`,
        );
      }

      const endereco = await this.enderecoRepository.findById(
        palete.enderecoSugeridoId,
      );

      if (!endereco || endereco.unidadeId !== input.unidadeId) {
        throw new BadRequestException(
          `Endereço inválido para palete ${palete.sequencia}`,
        );
      }

      const itemBase = itensPorProduto.get(palete.produtoId);

      if (!itemBase) {
        throw new BadRequestException(
          `Produto "${palete.produtoId}" não está aguardando armazenagem`,
        );
      }

      const codigo =
        palete.codigoUnitizador ??
        gerarCodigoUnitizadorPalete(input.numeroRecebimento, palete.sequencia);

      const unitizador = await this.armazenagemRepository.criarUnitizador({
        unidadeId: input.unidadeId,
        codigo,
        tipo: 'palete',
        origem: 'gerado_sistema',
        status: 'aguardando_armazenagem',
        recebimentoId: input.recebimentoId,
        enderecoAtualId: null,
      });

      const produto = await this.produtoRepository.findByProdutoId(
        palete.produtoId,
      );

      const itensTarefa = input.alocadorSaldo.alocar({
        produtoId: palete.produtoId,
        quantidade: palete.quantidade,
        unidadeMedida: itemBase.unidadeMedida,
        lote: itemBase.lote,
        validade: itemBase.validade,
        numeroSerie: itemBase.numeroSerie,
      });

      tarefas.push({
        unitizadorId: unitizador.id,
        sequencia: palete.sequencia,
        enderecoSugeridoId: palete.enderecoSugeridoId,
        itens: itensTarefa,
      });

      for (const itemAlocado of itensTarefa) {
        itensExpandidos.push({
          ...itemBase,
          unitizadorId: unitizador.id,
          quantidade: itemAlocado.quantidade,
          statusSaldo: itemAlocado.statusSaldo,
        });
      }

      etiquetas.push({
        unitizadorId: unitizador.id,
        codigo: unitizador.codigo,
        produtoId: palete.produtoId,
        sku: produto?.sku ?? palete.produtoId,
        descricao: produto?.descricao ?? palete.produtoId,
        quantidade: palete.quantidade,
        unidadeMedida: itemBase.unidadeMedida,
        lote: itemBase.lote,
        validade: itemBase.validade?.toISOString() ?? null,
        enderecoSugeridoLabel: endereco.enderecoMascarado,
        numeroRecebimento: input.numeroRecebimento,
      });
    }

    return { tarefas, etiquetas, itensExpandidos };
  }

  private async buildTarefasFromQtdPaletes(input: {
    itensAguardandoArmazenagem: ItemAguardandoArmazenagem[];
    paletesPorProduto: Map<string, number>;
    unidadeId: string;
    recebimentoId: string;
    numeroRecebimento: string;
    alocadorSaldo: AlocadorSaldoClassificado;
  }) {
    const paletesSimulados = this.montarPaletesArmazenagemService.execute({
      itensAguardandoArmazenagem: input.itensAguardandoArmazenagem,
      paletesPorProduto: input.paletesPorProduto,
      numeroRecebimento: input.numeroRecebimento,
    });

    const tarefas: TarefaArmazenagemInput[] = [];
    const etiquetas: EtiquetaPaleteGerada[] = [];
    const itensExpandidos: ItemAguardandoArmazenagem[] = [];

    for (const palete of paletesSimulados) {
      const unitizador = await this.armazenagemRepository.criarUnitizador({
        unidadeId: input.unidadeId,
        codigo: palete.codigoUnitizador,
        tipo: 'palete',
        origem: 'gerado_sistema',
        status: 'aguardando_armazenagem',
        recebimentoId: input.recebimentoId,
        enderecoAtualId: null,
      });

      const produto = await this.produtoRepository.findByProdutoId(
        palete.produtoId,
      );

      const itensTarefa = input.alocadorSaldo.alocar({
        produtoId: palete.produtoId,
        quantidade: palete.quantidade,
        unidadeMedida: palete.unidadeMedida,
        lote: palete.lote,
        validade: palete.validade,
        numeroSerie: palete.numeroSerie,
      });

      tarefas.push({
        unitizadorId: unitizador.id,
        sequencia: palete.sequenciaGlobal,
        itens: itensTarefa,
      });

      for (const itemAlocado of itensTarefa) {
        itensExpandidos.push({
          ...palete.itemBase,
          unitizadorId: unitizador.id,
          quantidade: itemAlocado.quantidade,
          statusSaldo: itemAlocado.statusSaldo,
        });
      }

      etiquetas.push({
        unitizadorId: unitizador.id,
        codigo: unitizador.codigo,
        produtoId: palete.produtoId,
        sku: produto?.sku ?? palete.produtoId,
        descricao: produto?.descricao ?? palete.produtoId,
        quantidade: palete.quantidade,
        unidadeMedida: palete.unidadeMedida,
        lote: palete.lote,
        validade: palete.validade?.toISOString() ?? null,
        enderecoSugeridoLabel: null,
        numeroRecebimento: input.numeroRecebimento,
      });
    }

    return { tarefas, etiquetas, itensExpandidos };
  }

  private async buildPaletesPorProdutoSugeridos(
    itensAguardandoArmazenagem: ItemAguardandoArmazenagem[],
  ): Promise<Map<string, number>> {
    const quantidadePorProduto = new Map<string, number>();

    for (const item of itensAguardandoArmazenagem) {
      quantidadePorProduto.set(
        item.produtoId,
        (quantidadePorProduto.get(item.produtoId) ?? 0) + item.quantidade,
      );
    }

    const paletesPorProduto = new Map<string, number>();

    for (const [produtoId, quantidadeTotal] of quantidadePorProduto) {
      const produto = await this.produtoRepository.findByProdutoId(produtoId);
      const capacidadePorPaleteUN = calcularCapacidadePaleteUN(produto);
      const qtdPaletes = calcularQtdPaletesSugerida(
        quantidadeTotal,
        capacidadePorPaleteUN,
      );

      if (qtdPaletes > 0) {
        paletesPorProduto.set(produtoId, qtdPaletes);
      }
    }

    return paletesPorProduto;
  }

  private enriquecerEtiquetasComEndereco(
    etiquetas: EtiquetaPaleteGerada[],
    tarefas: Array<{
      unitizadorId: string | null;
      enderecoSugeridoLabel: string | null;
    }>,
    itens: Array<{
      unitizadorId: string | null;
      enderecoSugeridoLabel: string | null;
    }>,
  ): EtiquetaPaleteGerada[] {
    const enderecoPorUnitizador = new Map<string, string | null>();

    for (const tarefa of tarefas) {
      if (tarefa.unitizadorId) {
        enderecoPorUnitizador.set(
          tarefa.unitizadorId,
          tarefa.enderecoSugeridoLabel,
        );
      }
    }

    for (const item of itens) {
      if (item.unitizadorId && !enderecoPorUnitizador.has(item.unitizadorId)) {
        enderecoPorUnitizador.set(
          item.unitizadorId,
          item.enderecoSugeridoLabel,
        );
      }
    }

    return etiquetas.map((etiqueta) => ({
      ...etiqueta,
      enderecoSugeridoLabel:
        etiqueta.enderecoSugeridoLabel ??
        enderecoPorUnitizador.get(etiqueta.unitizadorId) ??
        null,
    }));
  }
}
