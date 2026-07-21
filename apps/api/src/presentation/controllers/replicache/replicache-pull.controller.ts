import { Body, Controller, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProcessReplicachePullUseCase } from '../../../application/usecases/replicache/process-replicache-pull.usecase.js';
import {
  ReplicachePullRequestSchema,
  ReplicachePullResponseSchema,
} from '@lilog/contracts';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

class ReplicachePullBodyDto extends createZodDto(ReplicachePullRequestSchema) {}

class ReplicachePullResponseDto extends createZodDto(ReplicachePullResponseSchema) {}

const ReplicacheUnidadeQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class ReplicacheUnidadeQueryDto extends createZodDto(ReplicacheUnidadeQuerySchema) {}

@ApiTags('Replicache')
@Controller('replicache/recebimento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ReplicachePullController {
  constructor(
    private readonly processReplicachePullUseCase: ProcessReplicachePullUseCase,
  ) {}

  @RequirePermissions(
    RECEBIMENTO_PERMISSION.VISUALIZAR,
    RECEBIMENTO_PERMISSION.CONFERIR,
  )
  @Post('pull')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Replicache pull endpoint (recebimento pilot)',
    operationId: 'replicacheRecebimentoPull',
  })
  @ApiSuccessResponse(ReplicachePullResponseDto)
  handle(
    @Body() body: ReplicachePullBodyDto,
    @Query() query: ReplicacheUnidadeQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);
    return this.processReplicachePullUseCase.execute({
      request: body,
      unidadeId: query.unidadeId,
      userId: user?.id ?? 0,
    });
  }
}
