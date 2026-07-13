import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SyncBatchRequestSchema } from '../../../domain/model/sync/sync.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';
import { ProcessSyncBatchUseCase } from '../../../application/usecases/sync/process-sync-batch.usecase.js';

const ProcessSyncBatchBodySchema = SyncBatchRequestSchema;

class ProcessSyncBatchBodyDto extends createZodDto(ProcessSyncBatchBodySchema) {}

const ProcessSyncBatchResponseSchema = z.object({
  batchId: z.string(),
  adapter: z.string(),
  aggregateId: z.string(),
  resourceId: z.string().optional(),
  serverRevision: z.number().int().nonnegative(),
  appliedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  operations: z.array(
    z.object({
      opId: z.string(),
      status: z.string(),
      message: z.string().optional(),
      serverId: z.string().optional(),
      serverRevision: z.number().int().nonnegative().optional(),
    }),
  ),
  conflicts: z.array(
    z.object({
      opId: z.string(),
      status: z.string(),
      message: z.string().optional(),
    }),
  ),
});

class ProcessSyncBatchResponseDto extends createZodDto(ProcessSyncBatchResponseSchema) {}

@ApiTags('Sync')
@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ProcessSyncBatchController {
  constructor(
    private readonly processSyncBatchUseCase: ProcessSyncBatchUseCase,
  ) {}

  @Post('batches')
  @Auditable({ action: 'sync_batch', resource: 'sync' })
  @ApiOperation({
    summary: 'Processa um lote de operações de sincronização offline',
    operationId: 'processSyncBatch',
  })
  @ApiSuccessResponse(ProcessSyncBatchResponseDto, 'created')
  handle(
    @Body() body: ProcessSyncBatchBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.processSyncBatchUseCase.execute({
      request: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
