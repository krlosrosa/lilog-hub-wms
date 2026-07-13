import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { SyncOperation, SyncOperationResult } from '../../../../domain/model/sync/sync.model.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../../domain/repositories/user/user.repository.js';
import {
  PRE_RECEBIMENTO_REPOSITORY,
  type IPreRecebimentoRepository,
} from '../../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../../domain/repositories/recebimento/recebimento.repository.js';
import { ConferirItemUseCase } from '../../recebimento/conferir-item.usecase.js';
import { CreateChecklistRecebimentoUseCase } from '../../recebimento/create-checklist-recebimento.usecase.js';
import { EncerrarConferenciaUseCase } from '../../recebimento/encerrar-conferencia.usecase.js';
import { IniciarRecebimentoUseCase } from '../../recebimento/iniciar-recebimento.usecase.js';
import { RegistrarAvariaUseCase } from '../../recebimento/registrar-avaria.usecase.js';
import { RemoverAvariasRecebimentoUseCase } from '../../recebimento/remover-avarias-recebimento.usecase.js';
import { RemoverAvariaRecebimentoUseCase } from '../../recebimento/remover-avaria-recebimento.usecase.js';
import { RemoverConferenciaItemUseCase } from '../../recebimento/remover-conferencia-item.usecase.js';
import { RemoverLinhaConferenciaRecebimentoUseCase } from '../../recebimento/remover-linha-conferencia-recebimento.usecase.js';
import { RemoverPaleteConferenciaRecebimentoUseCase } from '../../recebimento/remover-palete-conferencia-recebimento.usecase.js';
import { RemovePesagemRecebimentoUseCase } from '../../recebimento/remove-pesagem-recebimento.usecase.js';
import { UpsertTemperaturaProdutoRecebimentoUseCase } from '../../recebimento/upsert-temperatura-produto-recebimento.usecase.js';
import { RegistrarImpedimentoRecebimentoUseCase } from '../../recebimento/registrar-impedimento-recebimento.usecase.js';
import { RetomarConferenciaImpedidaUseCase } from '../../recebimento/retomar-conferencia-impedida.usecase.js';
import type { ISyncAdapter, SyncApplyContext } from './sync-adapter.interface.js';

type OperationPriority = 0 | 1 | 2 | 2.9 | 3 | 3.1 | 3.5 | 3.55 | 4;

const OPERATION_PRIORITIES: Record<string, OperationPriority> = {
  'recebimento.checklist.upsert': 0,
  'recebimento.temperatura.upsert': 1,
  'recebimento.item.remove_by_produto': 2,
  'recebimento.item.conferir': 2,
  'recebimento.item_linha.remove': 2,
  'recebimento.palete.remove': 2,
  'recebimento.pesagem.remove': 2,
  'recebimento.avaria.clear': 2.9,
  'recebimento.avaria.registrar': 3,
  'recebimento.avaria.remover': 3.1,
  'recebimento.conferencia.suspender': 3.5,
  'recebimento.conferencia.retomar': 3.55,
  'recebimento.conferencia.encerrar': 4,
};

function getOperationPriority(type: string): number {
  return OPERATION_PRIORITIES[type] ?? 2;
}

function normalizeChecklistTempBau(value: unknown): number | undefined {
  if (value === '' || value == null) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveChecklistPhotoCount(payload: Record<string, unknown>): number {
  const explicit = payload['photoCount'];
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return Math.max(0, Math.trunc(explicit));
  }

  const photoMediaIds = payload['photoMediaIds'] as
    | {
        lacre?: string[];
        bauFechado?: string[];
        bauAberto?: string[];
        extras?: string[];
      }
    | undefined;

  if (!photoMediaIds) {
    return 0;
  }

  return [
    ...(photoMediaIds.lacre ?? []),
    ...(photoMediaIds.bauFechado ?? []),
    ...(photoMediaIds.bauAberto ?? []),
    ...(photoMediaIds.extras ?? []),
  ].length;
}

@Injectable()
export class RecebimentoV2SyncAdapter implements ISyncAdapter {
  readonly adapter = 'recebimento-v2';
  readonly protocolVersion = 2;
  readonly allowsPartialSuccess = true;

  constructor(
    @Inject(PRE_RECEBIMENTO_REPOSITORY)
    private readonly preRecebimentoRepository: IPreRecebimentoRepository,
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly iniciarRecebimentoUseCase: IniciarRecebimentoUseCase,
    private readonly createChecklistRecebimentoUseCase: CreateChecklistRecebimentoUseCase,
    private readonly upsertTemperaturaProdutoRecebimentoUseCase: UpsertTemperaturaProdutoRecebimentoUseCase,
    private readonly conferirItemUseCase: ConferirItemUseCase,
    private readonly removerConferenciaItemUseCase: RemoverConferenciaItemUseCase,
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
    private readonly removerPaleteConferenciaRecebimentoUseCase: RemoverPaleteConferenciaRecebimentoUseCase,
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
    private readonly removerAvariasRecebimentoUseCase: RemoverAvariasRecebimentoUseCase,
    private readonly removerAvariaRecebimentoUseCase: RemoverAvariaRecebimentoUseCase,
    private readonly encerrarConferenciaUseCase: EncerrarConferenciaUseCase,
    private readonly registrarImpedimentoRecebimentoUseCase: RegistrarImpedimentoRecebimentoUseCase,
    private readonly retomarConferenciaImpedidaUseCase: RetomarConferenciaImpedidaUseCase,
  ) {}

  async validateAggregate(
    aggregateId: string,
    unidadeId: string,
    _userId: number | null,
  ): Promise<void> {
    const preRecebimento = await this.preRecebimentoRepository.findById(aggregateId);
    if (!preRecebimento) {
      throw new NotFoundException(
        `Pré-recebimento "${aggregateId}" não encontrado`,
      );
    }
    if (preRecebimento.unidadeId !== unidadeId) {
      throw new NotFoundException(
        `Pré-recebimento "${aggregateId}" não pertence à unidade "${unidadeId}"`,
      );
    }
  }

  sortOperations(operations: SyncOperation[]): SyncOperation[] {
    return [...operations].sort((a, b) => {
      const priorityDiff = getOperationPriority(a.type) - getOperationPriority(b.type);
      if (priorityDiff !== 0) return priorityDiff;
      const seqDiff = a.sequence - b.sequence;
      if (seqDiff !== 0) return seqDiff;
      return a.createdAt - b.createdAt;
    });
  }

  async apply(
    operation: SyncOperation,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const payload = (operation.payload ?? {}) as Record<string, unknown>;

    try {
      switch (operation.type) {
        case 'recebimento.checklist.upsert':
          return await this.applyChecklistUpsert(operation, payload, context);

        case 'recebimento.temperatura.upsert':
          return await this.applyTemperaturaUpsert(operation, payload, context);

        case 'recebimento.item.conferir':
          return await this.applyConferirItem(operation, payload, context);

        case 'recebimento.item.remove_by_produto':
          return await this.applyRemoverItem(operation, payload, context);

        case 'recebimento.item_linha.remove':
          return await this.applyRemoverLinhaItem(operation, payload, context);

        case 'recebimento.palete.remove':
          return await this.applyRemoverPalete(operation, payload, context);

        case 'recebimento.pesagem.remove':
          return await this.applyRemoverPesagem(operation, payload, context);

        case 'recebimento.avaria.clear':
          return await this.applyAvariasClear(operation, context);

        case 'recebimento.avaria.registrar':
          return await this.applyRegistrarAvaria(operation, payload, context);

        case 'recebimento.avaria.remover':
          return await this.applyRemoverAvaria(operation, payload, context);

        case 'recebimento.conferencia.suspender':
          return await this.applyRegistrarImpedimento(operation, payload, context);

        case 'recebimento.conferencia.retomar':
          return await this.applyRetomarConferencia(operation, context);

        case 'recebimento.conferencia.encerrar':
          return await this.applyEncerrarConferencia(operation, payload, context);

        default:
          return {
            opId: operation.opId,
            status: 'rejected',
            message: `Tipo de operação não suportado: ${operation.type}`,
          };
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          opId: operation.opId,
          status: 'skipped',
          message: error.message,
        };
      }
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Private operation handlers
  // ---------------------------------------------------------------------------

  private async resolveOrCreateRecebimento(
    context: SyncApplyContext,
  ): Promise<string | null> {
    if (context.resourceId) return context.resourceId;

    const existing = await this.recebimentoRepository.findByPreRecebimentoId(
      context.aggregateId,
    );
    if (existing) {
      context.resourceId = existing.id;
      return existing.id;
    }

    return null;
  }

  private async resolveChecklistResponsavelId(
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<number | null> {
    const fromPayload = payload['responsavelId'];
    if (typeof fromPayload === 'number' && Number.isFinite(fromPayload)) {
      return fromPayload;
    }

    if (typeof fromPayload === 'string' && fromPayload.trim() !== '') {
      const parsed = Number(fromPayload);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    if (context.userId == null) {
      return null;
    }

    const user = await this.userRepository.findById(context.userId);
    return user?.funcionarioId ?? null;
  }

  private async applyChecklistUpsert(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const preRecebimentoId = context.aggregateId;
    const preRecebimento = await this.preRecebimentoRepository.findById(preRecebimentoId);

    if (preRecebimento?.situacao === 'impedido') {
      return {
        opId: operation.opId,
        status: 'retryable',
        message:
          'Conferência suspensa por impedimento. Retome a conferência para sincronizar o checklist.',
      };
    }

    const responsavelId = await this.resolveChecklistResponsavelId(payload, context);

    if (!responsavelId) {
      return {
        opId: operation.opId,
        status: 'retryable',
        message: 'responsavelId é obrigatório para iniciar recebimento',
      };
    }

    let recebimentoId = await this.resolveOrCreateRecebimento(context);

    if (!recebimentoId) {
      try {
        const created = await this.iniciarRecebimentoUseCase.execute({
          data: {
            preRecebimentoId,
            docaId: payload['docaId'] as string | undefined,
            responsavelId,
          },
          userId: context.userId,
        });
        recebimentoId = created.id;
        context.resourceId = recebimentoId;
      } catch (err) {
        if (err instanceof ConflictException) {
          const existing = await this.recebimentoRepository.findByPreRecebimentoId(preRecebimentoId);
          recebimentoId = existing?.id ?? null;
          context.resourceId = recebimentoId;
        } else {
          throw err;
        }
      }
    }

    if (!recebimentoId) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'Não foi possível iniciar recebimento para checklist',
      };
    }

    try {
      await this.createChecklistRecebimentoUseCase.execute({
        recebimentoId,
        data: {
          lacre: payload['lacre'] as string | undefined,
          tempBau: normalizeChecklistTempBau(payload['tempBau']),
          tempProduto: normalizeChecklistTempBau(payload['tempProduto']),
          conditions: payload['conditions'] as {
            limpeza: boolean;
            odor: boolean;
            estrutura: boolean;
            vedacao: boolean;
          },
          observacoes: payload['observacoes'] as string | undefined,
          photoCount: resolveChecklistPhotoCount(payload),
        },
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return {
          opId: operation.opId,
          status: 'skipped',
          message: 'Checklist já registrado',
          serverId: recebimentoId,
        };
      }
      throw err;
    }

    return {
      opId: operation.opId,
      status: 'applied',
      serverId: recebimentoId,
    };
  }

  private async applyTemperaturaUpsert(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'Recebimento não encontrado para registrar temperatura',
      };
    }

    await this.upsertTemperaturaProdutoRecebimentoUseCase.execute({
      recebimentoId,
      data: {
        etapa: payload['etapa'] as 'inicio' | 'meio' | 'fim',
        temperatura: payload['temperatura'] as number,
      },
      operatorId: context.userId,
    });

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyConferirItem(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'Recebimento não encontrado para conferir item',
      };
    }

    const validade = payload['validade'];

    const created = await this.conferirItemUseCase.execute({
      recebimentoId,
      data: {
        produtoId: payload['produtoId'] as string,
        quantidadeRecebida: payload['quantidadeRecebida'] as number,
        unidadeMedida: payload['unidadeMedida'] as string,
        loteRecebido: payload['loteRecebido'] as string | undefined,
        pesoRecebido: payload['pesoRecebido'] as number | undefined,
        etiquetaCodigo: payload['etiquetaCodigo'] as string | undefined,
        validade: validade ? new Date(validade as string) : undefined,
        numeroSerie: payload['numeroSerie'] as string | undefined,
        unitizadorCodigo: payload['unitizadorCodigo'] as string | undefined,
      },
      userId: context.userId,
    });

    return {
      opId: operation.opId,
      status: 'applied',
      serverId: created.id,
      ...(created.pesagemId ? { serverPesagemId: created.pesagemId } : {}),
    };
  }

  private async applyRemoverItem(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    try {
      await this.removerConferenciaItemUseCase.execute({
        recebimentoId,
        produtoId: payload['produtoId'] as string,
        userId: context.userId,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Item já removido' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyRemoverLinhaItem(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    const itemId = payload['itemId'];
    if (typeof itemId !== 'string' || !itemId.trim()) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'itemId é obrigatório para remover linha de conferência',
      };
    }

    try {
      await this.removerLinhaConferenciaRecebimentoUseCase.execute({
        recebimentoId,
        itemId: itemId.trim(),
        userId: context.userId,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Linha já removida' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyRemoverPalete(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    try {
      await this.removerPaleteConferenciaRecebimentoUseCase.execute({
        recebimentoId,
        unitizadorCodigo: payload['unitizadorCodigo'] as string,
        produtoId: payload['produtoId'] as string | undefined,
        userId: context.userId,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Palete já removido' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyRemoverPesagem(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    const pesagemId = payload['pesagemId'];
    if (typeof pesagemId !== 'string' || !pesagemId.trim()) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'pesagemId é obrigatório para remover pesagem',
      };
    }

    try {
      await this.removePesagemRecebimentoUseCase.execute({
        recebimentoId,
        pesagemId: pesagemId.trim(),
        userId: context.userId,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Pesagem já removida' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyAvariasClear(
    operation: SyncOperation,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    try {
      await this.removerAvariasRecebimentoUseCase.execute({ recebimentoId });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Avarias já removidas' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyRegistrarAvaria(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'Recebimento não encontrado para registrar avaria',
      };
    }

    const validade = payload['validade'];

    try {
      const result = await this.registrarAvariaUseCase.execute({
        recebimentoId,
        produtoId: payload['produtoId'] as string | undefined,
        lote: payload['lote'] as string | undefined,
        validade: validade ? new Date(validade as string) : undefined,
        numeroSerie: payload['numeroSerie'] as string | undefined,
        tipo: payload['tipo'] as string,
        natureza: payload['natureza'] as string,
        causa: payload['causa'] as string,
        quantidadeCaixas: payload['quantidadeCaixas'] as number,
        quantidadeUnidades: payload['quantidadeUnidades'] as number,
        photoCount: (payload['photoCount'] as number) ?? 0,
        replicarParaTodos: payload['replicarParaTodos'] as boolean | undefined,
        skusAlvo: payload['skusAlvo'] as string[] | undefined,
        operatorId: context.userId ?? 0,
      });
      const serverId = result.items[0]?.id;

      return {
        opId: operation.opId,
        status: 'applied',
        ...(serverId ? { serverId } : {}),
      };
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Avaria já registrada' };
      }
      throw err;
    }
  }

  private async applyRemoverAvaria(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    const avariaId = payload['avariaId'] as string | undefined;

    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    if (!avariaId?.trim()) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'avariaId é obrigatório para remover avaria',
      };
    }

    try {
      await this.removerAvariaRecebimentoUseCase.execute({
        recebimentoId,
        avariaId: avariaId.trim(),
      });
    } catch (err) {
      if (err instanceof NotFoundException) {
        return { opId: operation.opId, status: 'skipped', message: 'Avaria já removida' };
      }
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: err.message };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }

  private async applyRegistrarImpedimento(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const photoCount = payload['photoCount'];
    if (typeof photoCount !== 'number' || photoCount < 1) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'photoCount é obrigatório e deve ser maior que zero',
      };
    }

    const tipo = payload['tipo'];
    const descricao = payload['descricao'];
    if (typeof tipo !== 'string' || !tipo.trim()) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'tipo é obrigatório para registrar impedimento',
      };
    }

    if (typeof descricao !== 'string' || descricao.trim().length < 10) {
      return {
        opId: operation.opId,
        status: 'rejected',
        message: 'descricao deve ter ao menos 10 caracteres',
      };
    }

    const registradoPorId = payload['registradoPorId'];
    const parsedRegistradoPorId =
      typeof registradoPorId === 'number' && Number.isFinite(registradoPorId)
        ? registradoPorId
        : typeof registradoPorId === 'string' && registradoPorId.trim() !== ''
          ? Number(registradoPorId)
          : undefined;

    try {
      const impedimento = await this.registrarImpedimentoRecebimentoUseCase.execute({
        data: {
          preRecebimentoId: context.aggregateId,
          tipo: tipo as
            | 'carreta_tombada'
            | 'veiculo_avariado'
            | 'condicao_insegura'
            | 'acidente'
            | 'outro',
          descricao: descricao.trim(),
          photoCount: Math.trunc(photoCount),
          registradoPorId:
            parsedRegistradoPorId != null && Number.isFinite(parsedRegistradoPorId)
              ? parsedRegistradoPorId
              : undefined,
        },
        userId: context.userId,
      });

      return {
        opId: operation.opId,
        status: 'applied',
        serverId: impedimento.id,
      };
    } catch (err) {
      if (err instanceof ConflictException) {
        return {
          opId: operation.opId,
          status: 'skipped',
          message: err.message,
        };
      }
      throw err;
    }
  }

  private async applyRetomarConferencia(
    operation: SyncOperation,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    try {
      const result = await this.retomarConferenciaImpedidaUseCase.execute({
        preRecebimentoId: context.aggregateId,
        userId: context.userId,
      });

      return {
        opId: operation.opId,
        status: 'applied',
        serverId: result.impedimentoId,
      };
    } catch (err) {
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        return {
          opId: operation.opId,
          status: 'skipped',
          message: err.message,
        };
      }
      throw err;
    }
  }

  private async applyEncerrarConferencia(
    operation: SyncOperation,
    payload: Record<string, unknown>,
    context: SyncApplyContext,
  ): Promise<SyncOperationResult> {
    const recebimentoId = await this.resolveOrCreateRecebimento(context);
    if (!recebimentoId) {
      return { opId: operation.opId, status: 'skipped', message: 'Recebimento não encontrado' };
    }

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);
    if (recebimento && recebimento.situacao !== 'em_conferencia') {
      return {
        opId: operation.opId,
        status: 'skipped',
        message: `Recebimento já está em situação "${recebimento.situacao}"`,
      };
    }

    try {
      const quantidadePaletes = payload['quantidadePaletes'] as
        | number
        | undefined;

      if (
        quantidadePaletes === undefined ||
        !Number.isInteger(quantidadePaletes) ||
        quantidadePaletes <= 0
      ) {
        return {
          opId: operation.opId,
          status: 'rejected',
          message:
            'Quantidade de paletes recebidos é obrigatória para encerrar a conferência',
        };
      }

      await this.encerrarConferenciaUseCase.execute({
        recebimentoId,
        userId: context.userId,
        quantidadePaletes,
      });
    } catch (err) {
      if (err instanceof ConflictException) {
        return { opId: operation.opId, status: 'skipped', message: 'Conferência já encerrada' };
      }
      throw err;
    }

    return { opId: operation.opId, status: 'applied' };
  }
}
