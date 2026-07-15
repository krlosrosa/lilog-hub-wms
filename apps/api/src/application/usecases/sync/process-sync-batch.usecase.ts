import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  SyncBatchRequest,
  SyncBatchResult,
  SyncOperationResult,
} from '../../../domain/model/sync/sync.model.js';
import {
  SYNC_REPOSITORY,
  type ISyncRepository,
} from '../../../domain/repositories/sync/sync.repository.js';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user/user.repository.js';
import type { SyncApplyContext } from './adapters/sync-adapter.interface.js';
import { SyncAdapterRegistry } from './adapters/sync-adapter.registry.js';

function formatSyncApplyError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Erro ao processar operação';
  }

  const causeMessage =
    error.cause instanceof Error
      ? error.cause.message
      : typeof error.cause === 'string'
        ? error.cause
        : undefined;

  if (causeMessage && !error.message.includes(causeMessage)) {
    return `${error.message} — ${causeMessage}`;
  }

  return error.message;
}

export const SYNC_ADAPTER_REGISTRY = 'SyncAdapterRegistry';

type ProcessSyncBatchInput = {
  request: SyncBatchRequest;
  userId: number | null;
};

@Injectable()
export class ProcessSyncBatchUseCase {
  constructor(
    @Inject(SYNC_REPOSITORY)
    private readonly syncRepository: ISyncRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SYNC_ADAPTER_REGISTRY)
    private readonly adapterRegistry: SyncAdapterRegistry,
  ) {}

  async execute({
    request,
    userId,
  }: ProcessSyncBatchInput): Promise<SyncBatchResult> {
    const adapter = this.adapterRegistry.find(request.adapter);
    if (!adapter) {
      throw new BadRequestException(
        `Unknown adapter: ${request.adapter}`,
      );
    }

    const existingBatch = await this.syncRepository.findBatchByBatchIdAndAdapter(
      request.batchId,
      request.adapter,
    );
    if (existingBatch?.status === 'completed') {
      return this.buildReplayResult(existingBatch.id, request);
    }

    if (userId != null) {
      const accessibleUnidades =
        await this.userRepository.listAccessibleUnidades(userId);
      const hasAccess = accessibleUnidades.some(
        (u) => u.id === request.unidadeId,
      );
      if (!hasAccess) {
        throw new BadRequestException(
          `Usuário não tem acesso à unidade ${request.unidadeId}`,
        );
      }
    }

    await adapter.validateAggregate(
      request.aggregateId,
      request.unidadeId,
      userId,
    );

    const currentRevision = await this.syncRepository.getAggregateRevision(
      request.adapter,
      request.aggregateId,
    );

    if (request.baseRevision > 0 && currentRevision > request.baseRevision) {
      throw new ConflictException(
        JSON.stringify({
          code: 'REVISION_CONFLICT',
          baseRevision: request.baseRevision,
          currentRevision,
          message: 'Dados foram modificados desde a última sincronização. Atualize e tente novamente.',
        }),
      );
    }

    const batch = await this.syncRepository.createBatch({
      batchId: request.batchId,
      adapter: request.adapter,
      protocolVersion: request.protocolVersion,
      aggregateType: request.aggregateType,
      aggregateId: request.aggregateId,
      unidadeId: request.unidadeId,
      baseRevision: request.baseRevision,
      userId,
    });

    const sortedOps = adapter.sortOperations(request.operations);

    const context: SyncApplyContext = {
      aggregateId: request.aggregateId,
      unidadeId: request.unidadeId,
      userId,
      resourceId: null,
      idMappings: new Map(),
    };

    const results: SyncOperationResult[] = [];
    let appliedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let currentServerRevision = currentRevision;

    for (const op of sortedOps) {
      const existingOp =
        await this.syncRepository.findOperationByBatchAndOpId(
          batch.id,
          op.opId,
        );

      if (existingOp) {
        results.push({
          opId: op.opId,
          status: existingOp.status as SyncOperationResult['status'],
          message: existingOp.errorMessage ?? undefined,
        });
        if (existingOp.status === 'applied') appliedCount++;
        else if (existingOp.status === 'skipped') skippedCount++;
        else errorCount++;
        continue;
      }

      let result: SyncOperationResult;
      try {
        result = await adapter.apply(op, context);
      } catch (error) {
        const message = formatSyncApplyError(error);
        result = {
          opId: op.opId,
          status: 'retryable',
          message,
        };
      }

      if (result.status === 'applied') {
        appliedCount++;
        currentServerRevision = await this.syncRepository.incrementAggregateRevision(
          request.adapter,
          request.aggregateId,
          request.unidadeId,
        );
        await this.syncRepository.recordChange({
          adapter: request.adapter,
          unidadeId: request.unidadeId,
          entityType: request.aggregateType,
          entityId: result.serverId ?? request.aggregateId,
          operation: 'upsert',
          revision: currentServerRevision,
        });
        if (result.serverId && context.resourceId == null) {
          context.resourceId = result.serverId;
        }
      } else if (result.status === 'skipped') {
        skippedCount++;
      } else {
        errorCount++;
      }

      await this.syncRepository.createOperation({
        batchId: batch.id,
        opId: op.opId,
        opType: op.type,
        sequence: op.sequence,
        status: result.status,
        errorMessage: result.message,
      });

      results.push(result);
    }

    const finalStatus =
      errorCount > 0
        ? 'failed'
        : appliedCount > 0 || skippedCount > 0
          ? 'completed'
          : 'completed';

    await this.syncRepository.completeBatch(batch.id, {
      finalRevision: currentServerRevision,
      status: finalStatus,
      appliedCount,
      skippedCount,
      errorCount,
    });

    return {
      batchId: request.batchId,
      adapter: request.adapter,
      aggregateId: request.aggregateId,
      resourceId: context.resourceId ?? undefined,
      serverRevision: currentServerRevision,
      appliedCount,
      skippedCount,
      errorCount,
      operations: results,
    };
  }

  private async buildReplayResult(
    batchDbId: string,
    request: SyncBatchRequest,
  ): Promise<SyncBatchResult> {
    return {
      batchId: request.batchId,
      adapter: request.adapter,
      aggregateId: request.aggregateId,
      serverRevision: await this.syncRepository.getAggregateRevision(
        request.adapter,
        request.aggregateId,
      ),
      appliedCount: 0,
      skippedCount: request.operations.length,
      errorCount: 0,
      operations: request.operations.map((op) => ({
        opId: op.opId,
        status: 'skipped' as const,
        message: 'Batch already processed',
      })),
    };
  }
}
