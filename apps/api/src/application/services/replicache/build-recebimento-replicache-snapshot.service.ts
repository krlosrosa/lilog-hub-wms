import {
  avariaKey,
  checklistKey,
  demandKey,
  expectedItemKey,
  itemConferidoKey,
  parametrosConferenciaKey,
  resolveItemConferidoRecordId,
  temperaturaBauKey,
  type AvariaView,
  type ChecklistView,
  type DemandView,
  type ExpectedItemView,
  type ItemConferidoView,
  type ParametrosConferenciaView,
  type ReplicachePatchOperation,
  type TemperaturaBauView,
} from '@lilog/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type ChecklistRecebimentoRecord,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
  type RecebimentoAvariaRecord,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import { applyAuthoritativeDemandSituacao } from '../../../domain/services/resolve-authoritative-demand-situacao.js';
import { ListOperadorDemandasUseCase } from '../../usecases/recebimento/list-operador-demandas.usecase.js';
import { GetConferenciaContextUseCase } from '../../usecases/recebimento/get-conferencia-context.usecase.js';

function mapChecklistRecordToView(input: {
  preRecebimentoId: string;
  recebimentoId: string;
  dock: string | null;
  checklist: ChecklistRecebimentoRecord;
}): ChecklistView {
  const { checklist } = input;

  return {
    preRecebimentoId: input.preRecebimentoId,
    recebimentoId: input.recebimentoId,
    dock: input.dock,
    lacre: checklist.lacre ?? '',
    tempBau: checklist.tempBau,
    conditions: {
      limpeza: Boolean(checklist.conditions.limpeza ?? checklist.condicaoLimpeza),
      odor: Boolean(checklist.conditions.odor ?? checklist.condicaoOdor),
      estrutura: Boolean(checklist.conditions.estrutura ?? checklist.condicaoEstrutura),
      vedacao: Boolean(checklist.conditions.vedacao ?? checklist.condicaoVedacao),
    },
    observacoes: checklist.observacoes,
    photoCount: checklist.photoCount,
    savedAt: checklist.createdAt.toISOString(),
  };
}

async function mapAvariaRecordToView(
  record: RecebimentoAvariaRecord,
  produtoRepository: IProdutoRepository,
): Promise<AvariaView> {
  let sku: string | null = null;
  let descricao = 'Avaria';

  if (record.produtoId) {
    const produto = await produtoRepository.findByProdutoId(record.produtoId);
    sku = produto?.sku ?? null;
    descricao = produto?.descricao?.trim() || `Avaria SKU ${sku ?? '—'}`;
  }

  return {
    id: record.id,
    recebimentoId: record.recebimentoId,
    produtoId: record.produtoId,
    sku,
    descricao,
    tipo: record.tipo,
    natureza: record.natureza,
    causa: record.causa,
    quantidadeCaixas: record.quantidadeCaixas,
    quantidadeUnidades: record.quantidadeUnidades,
    lote: record.lote,
    validade: record.validade?.toISOString() ?? null,
    numeroSerie: record.numeroSerie,
    photoCount: record.photoCount,
    replicado: record.replicado,
    clientDamageId: record.clientDamageId,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class BuildRecebimentoReplicacheSnapshotService {
  private readonly logger = new Logger(BuildRecebimentoReplicacheSnapshotService.name);

  constructor(
    private readonly listOperadorDemandasUseCase: ListOperadorDemandasUseCase,
    private readonly getConferenciaContextUseCase: GetConferenciaContextUseCase,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly avariaRepository: IRecebimentoAvariaRepository,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async buildSnapshot(input: {
    unidadeId: string;
    userId: number;
  }): Promise<ReplicachePatchOperation[]> {
    const { items } = await this.listOperadorDemandasUseCase.execute({
      unidadeId: input.unidadeId,
      userId: input.userId,
    });

    const patch: ReplicachePatchOperation[] = [];
    const parametrosByUnidade = new Set<string>();

    for (const item of items) {
      const demandView: DemandView = {
        preRecebimentoId: item.preRecebimentoId,
        recebimentoId: item.recebimentoId,
        unidadeId: item.unidadeId,
        placa: item.placa,
        transportadoraNome: item.transportadoraNome,
        situacao: item.situacao,
        dock: item.dock,
        skuCount: item.skuCount,
        horarioPrevisto: item.horarioPrevisto,
        conferenteId: item.conferenteId,
        conferente: item.conferente,
        conferenteMatricula: item.conferenteMatricula,
        alocacaoFuncionarioId: item.alocacaoFuncionarioId,
        atribuidoAMim: item.atribuidoAMim,
      };

      patch.push({
        op: 'put',
        key: demandKey(item.preRecebimentoId),
        value: demandView,
      });

      try {
        const context = await this.getConferenciaContextUseCase.execute(
          item.preRecebimentoId,
        );

        const recebimentoIdFromContext = item.recebimentoId ?? context.recebimentoId;
        if (recebimentoIdFromContext && demandView.recebimentoId !== recebimentoIdFromContext) {
          demandView.recebimentoId = recebimentoIdFromContext;
        }
        applyAuthoritativeDemandSituacao(demandView, {
          preRecebimentoSituacao: context.situacao,
          recebimentoSituacao: context.recebimentoSituacao,
        });
        this.logger.debug(
          `Snapshot demanda ${item.preRecebimentoId}: situacao=${demandView.situacao} (pre=${context.situacao} recebimento=${context.recebimentoSituacao ?? 'null'})`,
        );
        if (context.dock && !demandView.dock) {
          demandView.dock = context.dock;
        }
        patch[patch.length - 1] = {
          op: 'put',
          key: demandKey(item.preRecebimentoId),
          value: demandView,
        };

        if (!parametrosByUnidade.has(item.unidadeId)) {
          const parametrosView: ParametrosConferenciaView = {
            quantidadeModo: context.parametrosConferencia.quantidadeModo,
            loteModo: context.parametrosConferencia.loteModo,
            controlaPalete: context.parametrosConferencia.controlaPalete,
            solicitarPesoPvar: context.parametrosConferencia.solicitarPesoPvar,
            exigirEtiquetaPesoVariavel:
              context.parametrosConferencia.exigirEtiquetaPesoVariavel,
          };

          patch.push({
            op: 'put',
            key: parametrosConferenciaKey(item.unidadeId),
            value: parametrosView,
          });
          parametrosByUnidade.add(item.unidadeId);
        }

        const expectedItemIds = new Set(context.itens.map((item) => item.produtoId));

        for (const expected of context.itens) {
          const expectedView: ExpectedItemView = {
            preRecebimentoId: item.preRecebimentoId,
            produtoId: expected.produtoId,
            sku: expected.sku,
            descricao: expected.descricao,
            unidadeMedida: expected.unidadeMedida,
            unidadesPorCaixa: expected.unidadesPorCaixa,
            quantidadeEsperada: expected.quantidadeEsperada,
            config: {
              controlaLote: expected.config.controlaLote,
              controlaValidade: expected.config.controlaValidade,
              controlaPeso: expected.config.controlaPeso,
              pesoVariavel: expected.config.pesoVariavel,
              exigirEtiquetaPesoVariavel: expected.config.exigirEtiquetaPesoVariavel,
              controlaNumeroSerie: expected.config.controlaNumeroSerie,
            },
            isNovo: expected.quantidadeEsperada === 0,
          };

          patch.push({
            op: 'put',
            key: expectedItemKey(item.preRecebimentoId, expected.produtoId),
            value: expectedView,
          });
        }

        for (const conferido of context.conferidos) {
          if (expectedItemIds.has(conferido.produtoId)) {
            continue;
          }

          const expectedView: ExpectedItemView = {
            preRecebimentoId: item.preRecebimentoId,
            produtoId: conferido.produtoId,
            sku: conferido.sku,
            descricao: conferido.descricao,
            unidadeMedida: conferido.unidadeMedida,
            unidadesPorCaixa: conferido.unidadesPorCaixa,
            quantidadeEsperada: 0,
            config: {
              controlaLote: conferido.config.controlaLote,
              controlaValidade: conferido.config.controlaValidade,
              controlaPeso: conferido.config.controlaPeso,
              pesoVariavel: conferido.config.pesoVariavel,
              exigirEtiquetaPesoVariavel: conferido.config.exigirEtiquetaPesoVariavel,
              controlaNumeroSerie: conferido.config.controlaNumeroSerie,
            },
            isNovo: true,
          };

          patch.push({
            op: 'put',
            key: expectedItemKey(item.preRecebimentoId, conferido.produtoId),
            value: expectedView,
          });
        }

        const recebimentoId = recebimentoIdFromContext;
        if (!recebimentoId) {
          continue;
        }

        for (const conferido of context.conferidos) {
          const recordId = resolveItemConferidoRecordId(
            conferido.pesagemId,
            conferido.recebimentoItemId,
          );
          const itemView: ItemConferidoView = {
            id: recordId,
            recebimentoId,
          produtoId: conferido.produtoId,
          sku: conferido.sku,
          descricao: conferido.descricao,
          quantidadeRecebida: conferido.quantidadeRecebida,
          unidadeMedida: conferido.unidadeMedida,
          loteRecebido: conferido.loteRecebido,
          validade: conferido.validade?.toISOString() ?? null,
          pesoRecebido: conferido.pesoRecebido,
          etiquetaCodigo: conferido.etiquetaCodigo,
          pesagemId: conferido.pesagemId,
          recebimentoItemId: conferido.recebimentoItemId,
          unitizadorCodigo: conferido.unitizadorCodigo,
        };

          patch.push({
            op: 'put',
            key: itemConferidoKey(
              item.preRecebimentoId,
              conferido.produtoId,
              recordId,
            ),
            value: itemView,
          });
        }

        const checklist = await this.conferenciaRepository.findChecklistByRecebimentoId(
          recebimentoId,
        );
        if (checklist) {
          const checklistView = mapChecklistRecordToView({
            preRecebimentoId: item.preRecebimentoId,
            recebimentoId,
            dock: context.dock ?? item.dock,
            checklist,
          });

          patch.push({
            op: 'put',
            key: checklistKey(item.preRecebimentoId),
            value: checklistView,
          });
        }

        const temperaturas =
          await this.conferenciaRepository.listTemperaturasProduto(recebimentoId);
        for (const temperatura of temperaturas) {
          const temperaturaView: TemperaturaBauView = {
            recebimentoId,
            etapa: temperatura.etapa,
            temperatura: temperatura.temperatura,
            medidoEm: temperatura.medidoEm.toISOString(),
          };

          patch.push({
            op: 'put',
            key: temperaturaBauKey(item.preRecebimentoId, temperatura.etapa),
            value: temperaturaView,
          });
        }

        const avarias = await this.avariaRepository.listByRecebimento(recebimentoId);
        for (const avaria of avarias) {
          const avariaView = await mapAvariaRecordToView(avaria, this.produtoRepository);
          patch.push({
            op: 'put',
            key: avariaKey(item.preRecebimentoId, avaria.id),
            value: avariaView,
          });
        }
      } catch {
        // Demanda fora do estado de conferência — mantém apenas DemandView.
      }
    }

    return patch;
  }
}
