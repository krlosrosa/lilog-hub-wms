import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { z } from 'zod';

import {
  AdicionarItemManualArgsSchema,
  avariaKey,
  checklistKey,
  ConferirItemArgsSchema,
  demandKey,
  EncerrarConferenciaArgsSchema,
  expectedItemKey,
  itemConferidoKey,
  LimparAvariasArgsSchema,
  REPLICACHE_MUTATIONS,
  RegistrarAvariaArgsSchema,
  RemoverAvariaArgsSchema,
  RemoverConferenciaArgsSchema,
  RemoverExpectedItemArgsSchema,
  resolveItemConferidoRecordId,
  temperaturaBauKey,
  UpsertChecklistArgsSchema,
  UpsertTemperaturaBauArgsSchema,
  SyncDemandaFromServerArgsSchema,
  type AvariaView,
  type ChecklistView,
  type DemandView,
  type ItemConferidoView,
  type ReplicachePushRequest,
  type TemperaturaBauView,
} from '@lilog/contracts';

import { AdicionarItemManualRecebimentoUseCase } from './adicionar-item-manual-recebimento.usecase.js';

import { ConferirItemUseCase } from '../recebimento/conferir-item.usecase.js';
import { CreateChecklistRecebimentoUseCase } from '../recebimento/create-checklist-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../recebimento/encerrar-conferencia.usecase.js';
import { IniciarRecebimentoUseCase } from '../recebimento/iniciar-recebimento.usecase.js';
import { ListOperadorDemandasUseCase } from '../recebimento/list-operador-demandas.usecase.js';
import { RegistrarAvariaUseCase } from '../recebimento/registrar-avaria.usecase.js';
import { RemoverAvariaRecebimentoUseCase } from '../recebimento/remover-avaria-recebimento.usecase.js';
import { RemoverAvariasRecebimentoUseCase } from '../recebimento/remover-avarias-recebimento.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from '../recebimento/remover-linha-conferencia-recebimento.usecase.js';
import { RemovePesagemRecebimentoUseCase } from '../recebimento/remove-pesagem-recebimento.usecase.js';
import { UpsertTemperaturaProdutoRecebimentoUseCase } from '../recebimento/upsert-temperatura-produto-recebimento.usecase.js';
import {
  REPLICACHE_REPOSITORY,
  type IReplicacheRepository,
} from '../../../domain/repositories/replicache/replicache.repository.js';
import type { RecebimentoAvariaRecord } from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  RECEBIMENTO_AVARIA_REPOSITORY,
  type IRecebimentoAvariaRepository,
} from '../../../domain/repositories/recebimento/recebimento-avaria.repository.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';

export type ProcessReplicachePushInput = {
  request: ReplicachePushRequest;
  unidadeId: string;
  userId: number;
};

type ConfirmedInBatchRecord = {
  realRecordId: string;
  pesagemId: string | null;
  recebimentoItemId: string;
};

type PushMutationContext = {
  userId: number;
  unidadeId: string;
  confirmedInBatch: Map<string, ConfirmedInBatchRecord>;
  resolvedRecebimentoIds: Map<string, string>;
};

@Injectable()
export class ProcessReplicachePushUseCase {
  private readonly logger = new Logger(ProcessReplicachePushUseCase.name);

  constructor(
    @Inject(REPLICACHE_REPOSITORY)
    private readonly replicacheRepository: IReplicacheRepository,
    private readonly conferirItemUseCase: ConferirItemUseCase,
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(RECEBIMENTO_AVARIA_REPOSITORY)
    private readonly avariaRepository: IRecebimentoAvariaRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly iniciarRecebimentoUseCase: IniciarRecebimentoUseCase,
    private readonly createChecklistRecebimentoUseCase: CreateChecklistRecebimentoUseCase,
    private readonly listOperadorDemandasUseCase: ListOperadorDemandasUseCase,
    private readonly adicionarItemManualRecebimentoUseCase: AdicionarItemManualRecebimentoUseCase,
    private readonly upsertTemperaturaProdutoRecebimentoUseCase: UpsertTemperaturaProdutoRecebimentoUseCase,
    private readonly encerrarConferenciaUseCase: EncerrarConferenciaUseCase,
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
    private readonly removerAvariaRecebimentoUseCase: RemoverAvariaRecebimentoUseCase,
    private readonly removerAvariasRecebimentoUseCase: RemoverAvariasRecebimentoUseCase,
    @Optional()
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository?: IConferenciaRepository,
  ) {}

  async execute(input: ProcessReplicachePushInput): Promise<void> {
    const confirmedInBatch = new Map<string, ConfirmedInBatchRecord>();
    const resolvedRecebimentoIds = new Map<string, string>();
    const sortedMutations = [...input.request.mutations].sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      if (a.clientID !== b.clientID) {
        return a.clientID.localeCompare(b.clientID);
      }
      return a.id - b.id;
    });

    for (const mutation of sortedMutations) {
      const lastMutationId = await this.replicacheRepository.getClientLastMutationId(
        mutation.clientID,
      );

      if (mutation.id <= lastMutationId) {
        continue;
      }

      if (mutation.id !== lastMutationId + 1) {
        throw new BadRequestException(
          `Mutation ${mutation.id} for client ${mutation.clientID} is out of order (last=${lastMutationId})`,
        );
      }

      let changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [];
      try {
        changes = await this.applyMutation(mutation.name, mutation.args, {
          userId: input.userId,
          unidadeId: input.unidadeId,
          confirmedInBatch,
          resolvedRecebimentoIds,
        });
      } catch (error) {
        if (this.isDiscardableMutationError(mutation.name, error)) {
          this.logger.warn(
            `Discarding mutation ${mutation.name}#${mutation.id} from ${mutation.clientID}: ${this.resolveErrorMessage(error)}`,
          );
          changes = [];
        } else {
          throw error;
        }
      }

      if (changes.length > 0) {
        await this.replicacheRepository.appendChanges(input.unidadeId, changes);
      } else {
        await this.replicacheRepository.bumpSpaceVersion(input.unidadeId);
      }

      await this.replicacheRepository.upsertClientMutationId({
        clientId: mutation.clientID,
        clientGroupId: input.request.clientGroupID,
        lastMutationId: mutation.id,
      });
    }
  }

  private async applyMutation(
    name: string,
    args: unknown,
    context: PushMutationContext,
  ): Promise<Array<{ key: string; op: 'put' | 'del'; value?: unknown }>> {
    if (
      name === REPLICACHE_MUTATIONS.conferirItem ||
      name === 'recebimento/conferirItem'
    ) {
      return this.applyConferirItem(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.removerConferencia ||
      name === 'recebimento/removerConferencia'
    ) {
      return this.applyRemoverConferencia(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.upsertChecklist ||
      name === 'recebimento/upsertChecklist'
    ) {
      return this.applyUpsertChecklist(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.adicionarItemManual ||
      name === 'recebimento/adicionarItemManual'
    ) {
      return this.applyAdicionarItemManual(args);
    }

    if (
      name === REPLICACHE_MUTATIONS.upsertTemperaturaBau ||
      name === 'recebimento/upsertTemperaturaBau'
    ) {
      return this.applyUpsertTemperaturaBau(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.encerrarConferencia ||
      name === 'recebimento/encerrarConferencia'
    ) {
      return this.applyEncerrarConferencia(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.registrarAvaria ||
      name === 'recebimento/registrarAvaria'
    ) {
      return this.applyRegistrarAvaria(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.removerAvaria ||
      name === 'recebimento/removerAvaria'
    ) {
      return this.applyRemoverAvaria(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.limparAvarias ||
      name === 'recebimento/limparAvarias'
    ) {
      return this.applyLimparAvarias(args, context);
    }

    if (
      name === REPLICACHE_MUTATIONS.removerExpectedItem ||
      name === 'recebimento/removerExpectedItem'
    ) {
      return this.applyRemoverExpectedItem(args);
    }

    if (
      name === REPLICACHE_MUTATIONS.syncDemandaFromServer ||
      name === 'recebimento/syncDemandaFromServer'
    ) {
      SyncDemandaFromServerArgsSchema.parse(args);
      return [];
    }

    this.logger.warn(`Unknown replicache mutation: ${name}`);
    throw new BadRequestException(`Unknown mutation: ${name}`);
  }

  private async applyConferirItem(args: unknown, context: PushMutationContext) {
    const parsed = ConferirItemArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    let result;
    try {
      result = await this.conferirItemUseCase.execute({
        recebimentoId,
        data: {
          ...parsed,
          validade: parsed.validade ? new Date(parsed.validade) : undefined,
        },
        userId: context.userId,
        clientConferenceId: parsed.clientRecordId,
      });
    } catch (error) {
      if (this.isRecebimentoNotEmConferenciaError(error)) {
        return [];
      }
      throw error;
    }

    const produto = await this.produtoRepository.findByProdutoId(parsed.produtoId);

    const recordId = resolveItemConferidoRecordId(result.pesagemId, result.id);

    if (parsed.clientRecordId) {
      context.confirmedInBatch.set(parsed.clientRecordId, {
        realRecordId: recordId,
        pesagemId: result.pesagemId ?? null,
        recebimentoItemId: result.id,
      });
    }

    const itemView: ItemConferidoView = {
      id: recordId,
      recebimentoId,
      produtoId: parsed.produtoId,
      sku: produto?.sku ?? parsed.produtoId,
      descricao: produto?.descricao ?? parsed.produtoId,
      quantidadeRecebida: result.quantidadeRecebida,
      unidadeMedida: result.unidadeMedida,
      loteRecebido: parsed.loteRecebido ?? null,
      validade: parsed.validade ?? null,
      pesoRecebido: result.pesoRecebido ?? parsed.pesoRecebido ?? null,
      etiquetaCodigo: result.etiquetaCodigo,
      pesagemId: result.pesagemId,
      recebimentoItemId: result.id,
      unitizadorCodigo: parsed.unitizadorCodigo ?? null,
    };

    const changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [
      {
        op: 'put' as const,
        key: itemConferidoKey(
          parsed.preRecebimentoId,
          parsed.produtoId,
          recordId,
        ),
        value: itemView,
      },
    ];

    if (parsed.clientRecordId && parsed.clientRecordId !== recordId) {
      changes.push({
        op: 'del' as const,
        key: itemConferidoKey(
          parsed.preRecebimentoId,
          parsed.produtoId,
          parsed.clientRecordId,
        ),
      });
    }

    const demandView = await this.resolveDemandView(
      parsed.preRecebimentoId,
      context.userId,
      context.unidadeId,
    );
    if (demandView) {
      changes.push({
        op: 'put' as const,
        key: demandKey(parsed.preRecebimentoId),
        value: { ...demandView, recebimentoId },
      });
    }

    return changes;
  }

  private async applyRemoverConferencia(args: unknown, context: PushMutationContext) {
    const parsed = RemoverConferenciaArgsSchema.parse(args);
    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );
    const batchEntry = context.confirmedInBatch.get(parsed.conferenciaRecordId);

    if (batchEntry) {
      const delChange = {
        op: 'del' as const,
        key: itemConferidoKey(
          parsed.preRecebimentoId,
          parsed.produtoId,
          batchEntry.realRecordId,
        ),
      };

      try {
        if (batchEntry.pesagemId) {
          await this.removePesagemRecebimentoUseCase.execute({
            recebimentoId,
            pesagemId: batchEntry.pesagemId,
            userId: context.userId,
          });
        } else {
          await this.removerLinhaConferenciaRecebimentoUseCase.execute({
            recebimentoId,
            itemId: batchEntry.recebimentoItemId,
            userId: context.userId,
          });
        }
      } catch (error) {
        if (this.isRecebimentoNotEmConferenciaError(error)) {
          return [];
        }
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }

      return [delChange];
    }

    const delChange = {
      op: 'del' as const,
      key: itemConferidoKey(
        parsed.preRecebimentoId,
        parsed.produtoId,
        parsed.conferenciaRecordId,
      ),
    };

    try {
      if (parsed.isPvar && parsed.pesagemId) {
        await this.removePesagemRecebimentoUseCase.execute({
          recebimentoId,
          pesagemId: parsed.pesagemId,
          userId: context.userId,
        });
      } else {
        await this.removerLinhaConferenciaRecebimentoUseCase.execute({
          recebimentoId,
          itemId: parsed.recebimentoItemId,
          userId: context.userId,
        });
      }
    } catch (error) {
      if (this.isRecebimentoNotEmConferenciaError(error)) {
        return [];
      }
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      const resolved = await this.resolveConferenciaRemovalTarget(
        parsed.preRecebimentoId,
        parsed.conferenciaRecordId,
      );
      if (!resolved) {
        return [delChange];
      }

      try {
        if (resolved.pesagemId) {
          await this.removePesagemRecebimentoUseCase.execute({
            recebimentoId,
            pesagemId: resolved.pesagemId,
            userId: context.userId,
          });
        } else {
          await this.removerLinhaConferenciaRecebimentoUseCase.execute({
            recebimentoId,
            itemId: resolved.recebimentoItemId,
            userId: context.userId,
          });
        }
      } catch (retryError) {
        if (this.isRecebimentoNotEmConferenciaError(retryError)) {
          return [];
        }
        if (!(retryError instanceof NotFoundException)) {
          throw retryError;
        }
      }
    }

    return [delChange];
  }

  private normalizeChecklistTempBau(value: unknown): number | undefined {
    if (value === '' || value == null) {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private isRecebimentoNotEmConferenciaError(error: unknown): boolean {
    if (!(error instanceof BadRequestException)) {
      return false;
    }

    const msg = error.message;
    return (
      msg === 'Conferência só é permitida com recebimento em andamento' ||
      msg === 'Checklist só pode ser registrado para recebimentos em andamento' ||
      msg === 'Avarias só podem ser registradas durante a conferência' ||
      msg === 'Remoção de conferência só é permitida com recebimento em andamento' ||
      msg === 'Remoção de pesagem só é permitida com recebimento em andamento'
    );
  }

  private isDiscardableMutationError(name: string, error: unknown): boolean {
    if (
      name !== REPLICACHE_MUTATIONS.registrarAvaria &&
      name !== 'recebimento/registrarAvaria'
    ) {
      return false;
    }

    if (!(error instanceof BadRequestException)) {
      return false;
    }

    const message = this.resolveErrorMessage(error);
    return (
      message === 'Selecione o lote conferido para associar a avaria' ||
      message.startsWith('Lote "') ||
      message === 'Informe caixas e/ou unidades avariadas'
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      if (response && typeof response === 'object' && 'message' in response) {
        const message = (response as { message?: unknown }).message;
        if (Array.isArray(message)) {
          return message.join(', ');
        }
        if (typeof message === 'string') {
          return message;
        }
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }

  private async resolveDemandView(
    preRecebimentoId: string,
    userId: number,
    unidadeId: string,
  ): Promise<DemandView | null> {
    const { items } = await this.listOperadorDemandasUseCase.execute({
      unidadeId,
      userId,
    });

    const demand = items.find((item) => item.preRecebimentoId === preRecebimentoId);
    if (!demand) {
      return null;
    }

    return {
      preRecebimentoId: demand.preRecebimentoId,
      recebimentoId: demand.recebimentoId,
      unidadeId: demand.unidadeId,
      placa: demand.placa,
      transportadoraNome: demand.transportadoraNome,
      situacao: demand.situacao,
      dock: demand.dock,
      skuCount: demand.skuCount,
      horarioPrevisto: demand.horarioPrevisto,
      conferenteId: demand.conferenteId,
      conferente: demand.conferente,
      conferenteMatricula: demand.conferenteMatricula,
      alocacaoFuncionarioId: demand.alocacaoFuncionarioId,
      atribuidoAMim: demand.atribuidoAMim,
    };
  }

  private async resolveRecebimentoId(
    preRecebimentoId: string,
    context: PushMutationContext,
    options?: {
      dockId?: string;
      responsavelId?: number;
      skipImpedidoCheck?: boolean;
    },
  ): Promise<string> {
    const cached = context.resolvedRecebimentoIds.get(preRecebimentoId);
    if (cached) {
      return cached;
    }

    const preRecebimento =
      await this.preRecebimentoRepository.findById(preRecebimentoId);
    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${preRecebimentoId}" não encontrado`,
      );
    }

    if (!options?.skipImpedidoCheck && preRecebimento.situacao === 'impedido') {
      throw new BadRequestException(
        'Conferência suspensa por impedimento. Retome a conferência para sincronizar.',
      );
    }

    const existing = await this.recebimentoRepository.findByPreRecebimentoId(
      preRecebimentoId,
    );
    if (existing) {
      context.resolvedRecebimentoIds.set(preRecebimentoId, existing.id);
      return existing.id;
    }

    const responsavelId =
      options?.responsavelId ??
      ((await this.userRepository.findById(context.userId))?.funcionarioId ??
        null);

    if (!responsavelId) {
      throw new BadRequestException(
        'Não foi possível iniciar recebimento para sincronizar',
      );
    }

    const docaIdFromOptions = z.uuid().safeParse(options?.dockId);
    const docaIdFromPreRecebimento = z
      .uuid()
      .safeParse(preRecebimento.docaId ?? undefined);
    const docaId = docaIdFromOptions.success
      ? docaIdFromOptions.data
      : docaIdFromPreRecebimento.success
        ? docaIdFromPreRecebimento.data
        : undefined;

    try {
      const created = await this.iniciarRecebimentoUseCase.execute({
        data: {
          preRecebimentoId,
          docaId,
          responsavelId,
        },
        userId: context.userId,
      });
      context.resolvedRecebimentoIds.set(preRecebimentoId, created.id);
      return created.id;
    } catch (error) {
      if (error instanceof ConflictException) {
        const fallback = await this.recebimentoRepository.findByPreRecebimentoId(
          preRecebimentoId,
        );
        if (fallback?.id) {
          context.resolvedRecebimentoIds.set(preRecebimentoId, fallback.id);
          return fallback.id;
        }
      }
      throw error;
    }
  }

  private async applyUpsertChecklist(args: unknown, context: PushMutationContext) {
    const parsed = UpsertChecklistArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
      {
        dockId: parsed.dockId,
        responsavelId: parsed.responsavelId,
        skipImpedidoCheck: false,
      },
    );

    let checklistRecord;
    try {
      checklistRecord = await this.createChecklistRecebimentoUseCase.execute({
        recebimentoId,
        userId: context.userId,
        data: {
          lacre: parsed.lacre,
          tempBau: this.normalizeChecklistTempBau(parsed.tempBau),
          tempProduto: undefined,
          conditions: {
            limpeza: parsed.conditions.limpeza ?? false,
            odor: parsed.conditions.odor ?? false,
            estrutura: parsed.conditions.estrutura ?? false,
            vedacao: parsed.conditions.vedacao ?? false,
          },
          observacoes: parsed.observacoes,
          photoCount: parsed.photoCount,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        return [];
      }
      if (this.isRecebimentoNotEmConferenciaError(error)) {
        return [];
      }
      throw error;
    }

    const demandView = await this.resolveDemandView(
      parsed.preRecebimentoId,
      context.userId,
      context.unidadeId,
    );

    const checklistView: ChecklistView = {
      preRecebimentoId: parsed.preRecebimentoId,
      recebimentoId,
      dock: demandView?.dock ?? null,
      lacre: checklistRecord.lacre ?? parsed.lacre,
      tempBau: checklistRecord.tempBau,
      conditions: {
        limpeza: Boolean(
          checklistRecord.conditions.limpeza ?? checklistRecord.condicaoLimpeza,
        ),
        odor: Boolean(checklistRecord.conditions.odor ?? checklistRecord.condicaoOdor),
        estrutura: Boolean(
          checklistRecord.conditions.estrutura ?? checklistRecord.condicaoEstrutura,
        ),
        vedacao: Boolean(
          checklistRecord.conditions.vedacao ?? checklistRecord.condicaoVedacao,
        ),
      },
      observacoes: checklistRecord.observacoes,
      photoCount: checklistRecord.photoCount,
      savedAt: checklistRecord.createdAt.toISOString(),
    };

    const changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [
      {
        op: 'put' as const,
        key: checklistKey(parsed.preRecebimentoId),
        value: checklistView,
      },
    ];

    if (demandView) {
      changes.push({
        op: 'put' as const,
        key: demandKey(parsed.preRecebimentoId),
        value: {
          ...demandView,
          recebimentoId,
        },
      });
    }

    return changes;
  }

  private async applyAdicionarItemManual(args: unknown) {
    const parsed = AdicionarItemManualArgsSchema.parse(args);

    const expectedView = await this.adicionarItemManualRecebimentoUseCase.execute({
      preRecebimentoId: parsed.preRecebimentoId,
      produtoId: parsed.produtoId,
      sku: parsed.sku,
    });

    return [
      {
        op: 'put' as const,
        key: expectedItemKey(parsed.preRecebimentoId, parsed.produtoId),
        value: expectedView,
      },
    ];
  }

  private async applyRemoverExpectedItem(args: unknown) {
    const parsed = RemoverExpectedItemArgsSchema.parse(args);
    const removed = await this.adicionarItemManualRecebimentoUseCase.removeManualItem({
      preRecebimentoId: parsed.preRecebimentoId,
      produtoId: parsed.produtoId,
    });

    if (!removed) {
      return [];
    }

    return [
      {
        op: 'del' as const,
        key: expectedItemKey(parsed.preRecebimentoId, parsed.produtoId),
      },
    ];
  }

  private async applyUpsertTemperaturaBau(
    args: unknown,
    context: PushMutationContext,
  ) {
    const parsed = UpsertTemperaturaBauArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    const record = await this.upsertTemperaturaProdutoRecebimentoUseCase.execute({
      recebimentoId,
      data: {
        etapa: parsed.etapa,
        temperatura: parsed.temperatura,
      },
      operatorId: context.userId,
    });

    const view: TemperaturaBauView = {
      recebimentoId: record.recebimentoId,
      etapa: record.etapa,
      temperatura: record.temperatura,
      medidoEm: record.medidoEm,
    };

    const changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [
      {
        op: 'put' as const,
        key: temperaturaBauKey(parsed.preRecebimentoId, parsed.etapa),
        value: view,
      },
    ];

    const demandView = await this.resolveDemandView(
      parsed.preRecebimentoId,
      context.userId,
      context.unidadeId,
    );
    if (demandView) {
      changes.push({
        op: 'put' as const,
        key: demandKey(parsed.preRecebimentoId),
        value: { ...demandView, recebimentoId },
      });
    }

    return changes;
  }

  private async applyEncerrarConferencia(
    args: unknown,
    context: PushMutationContext,
  ) {
    const parsed = EncerrarConferenciaArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    try {
      await this.encerrarConferenciaUseCase.execute({
        recebimentoId,
        userId: context.userId,
        quantidadePaletes: parsed.quantidadePaletes,
        teveSobreposicaoCarga: parsed.teveSobreposicaoCarga,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        return [];
      }
      throw error;
    }

    const demandView = await this.resolveDemandView(
      parsed.preRecebimentoId,
      context.userId,
      context.unidadeId,
    );
    const resolvedDemandView =
      demandView ??
      (await this.buildFallbackConferidoDemandView(
        parsed.preRecebimentoId,
        recebimentoId,
      ));
    if (!resolvedDemandView) {
      return [];
    }

    const updatedDemand: DemandView = {
      ...resolvedDemandView,
      recebimentoId,
    };

    return [
      {
        op: 'put' as const,
        key: demandKey(parsed.preRecebimentoId),
        value: updatedDemand,
      },
    ];
  }

  private async mapAvariaRecordToView(
    record: RecebimentoAvariaRecord,
  ): Promise<AvariaView> {
    let sku: string | null = null;
    let descricao = 'Avaria';

    if (record.produtoId) {
      const produto = await this.produtoRepository.findByProdutoId(record.produtoId);
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

  private buildAvariaChanges(
    preRecebimentoId: string,
    records: RecebimentoAvariaRecord[],
    clientDamageId?: string | null,
  ): Promise<Array<{ key: string; op: 'put' | 'del'; value?: unknown }>> {
    return Promise.all(
      records.map(async (record) => {
        const view = await this.mapAvariaRecordToView(record);
        const changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }> = [];

        if (clientDamageId && clientDamageId !== record.id) {
          changes.push({
            op: 'del',
            key: avariaKey(preRecebimentoId, clientDamageId),
          });
        }

        changes.push({
          op: 'put',
          key: avariaKey(preRecebimentoId, record.id),
          value: view,
        });

        return changes;
      }),
    ).then((nested) => nested.flat());
  }

  private async applyRegistrarAvaria(
    args: unknown,
    context: PushMutationContext,
  ) {
    const parsed = RegistrarAvariaArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    try {
      const result = await this.registrarAvariaUseCase.execute({
        recebimentoId,
        produtoId: parsed.produtoId,
        lote: parsed.lote,
        validade: parsed.validade ? new Date(parsed.validade) : undefined,
        numeroSerie: parsed.numeroSerie,
        tipo: parsed.tipo,
        natureza: parsed.natureza,
        causa: parsed.causa,
        quantidadeCaixas: parsed.quantidadeCaixas,
        quantidadeUnidades: parsed.quantidadeUnidades,
        photoCount: parsed.photoCount,
        replicarParaTodos: parsed.replicarParaTodos,
        skusAlvo: parsed.skusAlvo,
        clientDamageId: parsed.clientDamageId,
        operatorId: context.userId,
      });

      const records: RecebimentoAvariaRecord[] = result.items.map((item) => ({
        id: item.id,
        recebimentoId,
        produtoId: item.produtoId,
        tipo: item.tipo,
        natureza: item.natureza,
        causa: item.causa,
        quantidadeCaixas: item.quantidadeCaixas,
        quantidadeUnidades: item.quantidadeUnidades,
        lote: item.lote,
        validade: item.validade ? new Date(item.validade) : null,
        numeroSerie: item.numeroSerie,
        photoCount: item.photoCount,
        replicado: item.replicado,
        clientDamageId: item.clientDamageId ?? parsed.clientDamageId ?? null,
        operatorId: context.userId,
        createdAt: new Date(item.createdAt),
      }));

      const changes = await this.buildAvariaChanges(
        parsed.preRecebimentoId,
        records,
        parsed.clientDamageId,
      );

      const demandView = await this.resolveDemandView(
        parsed.preRecebimentoId,
        context.userId,
        context.unidadeId,
      );
      if (demandView) {
        changes.push({
          op: 'put' as const,
          key: demandKey(parsed.preRecebimentoId),
          value: { ...demandView, recebimentoId },
        });
      }

      return changes;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        this.isRecebimentoNotEmConferenciaError(error)
      ) {
        return [];
      }
      throw error;
    }
  }

  private async applyRemoverAvaria(args: unknown, context: PushMutationContext) {
    const parsed = RemoverAvariaArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    const { targetAvariaId, keysToDelete } = await this.resolveAvariaRemovalTarget(
      recebimentoId,
      parsed.preRecebimentoId,
      parsed.avariaId,
    );

    try {
      await this.removerAvariaRecebimentoUseCase.execute({
        recebimentoId,
        avariaId: targetAvariaId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        (error instanceof BadRequestException &&
          error.message === 'Avarias só podem ser removidas durante a conferência')
      ) {
        return [];
      }
      throw error;
    }

    return keysToDelete.map((key) => ({
      op: 'del' as const,
      key,
    }));
  }

  private async applyLimparAvarias(args: unknown, context: PushMutationContext) {
    const parsed = LimparAvariasArgsSchema.parse(args);

    const recebimentoId = await this.resolveRecebimentoId(
      parsed.preRecebimentoId,
      context,
    );

    const existing = await this.avariaRepository.listByRecebimento(recebimentoId);

    try {
      await this.removerAvariasRecebimentoUseCase.execute({
        recebimentoId,
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        (error instanceof BadRequestException &&
          error.message === 'Avarias só podem ser removidas durante a conferência')
      ) {
        return [];
      }
      throw error;
    }

    const keys = new Set(
      existing.map((avaria) => avariaKey(parsed.preRecebimentoId, avaria.id)),
    );

    for (const avaria of existing) {
      if (avaria.clientDamageId && avaria.clientDamageId !== avaria.id) {
        keys.add(avariaKey(parsed.preRecebimentoId, avaria.clientDamageId));
      }
    }

    return [...keys].map((key) => ({
      op: 'del' as const,
      key,
    }));
  }

  private async buildFallbackConferidoDemandView(
    preRecebimentoId: string,
    recebimentoId: string,
  ): Promise<DemandView | null> {
    const preRecebimento =
      await this.preRecebimentoRepository.findById(preRecebimentoId);
    if (!preRecebimento) {
      return null;
    }

    const recebimento =
      await this.recebimentoRepository.findByPreRecebimentoId(preRecebimentoId);

    return {
      preRecebimentoId,
      recebimentoId,
      unidadeId: preRecebimento.unidadeId,
      placa: preRecebimento.placa,
      transportadoraNome: preRecebimento.transportadoraNome,
      situacao:
        preRecebimento.situacao === 'finalizado'
          ? 'finalizado'
          : 'conferido',
      dock: null,
      skuCount: preRecebimento.itens.length,
      horarioPrevisto: preRecebimento.horarioPrevisto.toISOString(),
      conferenteId: recebimento?.responsavelId ?? null,
      conferente: null,
      conferenteMatricula: null,
      alocacaoFuncionarioId: null,
      atribuidoAMim: false,
    };
  }

  private async resolveAvariaRemovalTarget(
    recebimentoId: string,
    preRecebimentoId: string,
    avariaId: string,
  ): Promise<{ targetAvariaId: string; keysToDelete: string[] }> {
    const existingAvarias = await this.avariaRepository.listByRecebimento(recebimentoId);
    const matched = existingAvarias.find(
      (entry) => entry.id === avariaId || entry.clientDamageId === avariaId,
    );

    const targetAvariaId = matched?.id ?? avariaId;
    const keys = new Set<string>([avariaKey(preRecebimentoId, avariaId)]);

    if (matched) {
      keys.add(avariaKey(preRecebimentoId, matched.id));
      if (matched.clientDamageId) {
        keys.add(avariaKey(preRecebimentoId, matched.clientDamageId));
      }
    }

    return { targetAvariaId, keysToDelete: [...keys] };
  }

  private async resolveConferenciaRemovalTarget(
    preRecebimentoId: string,
    conferenciaRecordId: string,
  ): Promise<{ recebimentoItemId: string; pesagemId: string | null } | null> {
    if (!this.conferenciaRepository) {
      return null;
    }

    const context =
      await this.conferenciaRepository.getConferenciaContext(preRecebimentoId);
    const matched = context?.conferidos.find(
      (item) =>
        item.clientConferenceId === conferenciaRecordId ||
        item.id === conferenciaRecordId,
    );

    if (!matched) {
      return null;
    }

    return {
      recebimentoItemId: matched.recebimentoItemId,
      pesagemId: matched.pesagemId ?? null,
    };
  }
}
