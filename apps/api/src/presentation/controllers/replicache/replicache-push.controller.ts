import { Body, Controller, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProcessReplicachePushUseCase } from '../../../application/usecases/replicache/process-replicache-push.usecase.js';
import { ReplicachePushRequestSchema } from '@lilog/contracts';
import {
  ApiErrorResponses,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const ReplicachePushBodyDtoSchema = ReplicachePushRequestSchema;

class ReplicachePushBodyDto extends createZodDto(ReplicachePushBodyDtoSchema) {}

const ReplicacheUnidadeQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class ReplicacheUnidadeQueryDto extends createZodDto(ReplicacheUnidadeQuerySchema) {}

@ApiTags('Replicache')
@Controller('replicache/recebimento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ReplicachePushController {
  constructor(
    private readonly processReplicachePushUseCase: ProcessReplicachePushUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'replicache_push', resource: 'replicache' })
  @Post('push')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Replicache push endpoint (recebimento pilot)',
    operationId: 'replicacheRecebimentoPush',
  })
  handle(
    @Body() body: ReplicachePushBodyDto,
    @Query() query: ReplicacheUnidadeQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);
    return this.processReplicachePushUseCase.execute({
      request: body,
      unidadeId: query.unidadeId,
      userId: user?.id ?? 0,
    });
  }
}
