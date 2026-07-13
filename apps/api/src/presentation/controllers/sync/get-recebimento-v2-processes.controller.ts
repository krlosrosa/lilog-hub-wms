import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GetRecebimentoV2ProcessesQueryDto,
} from '../../../application/dtos/sync/get-recebimento-v2-processes.dto.js';
import { GetRecebimentoV2ProcessesUseCase } from '../../../application/usecases/sync/get-recebimento-v2-processes.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Sync')
@Controller('sync/adapters/recebimento-v2')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecebimentoV2ProcessesController {
  constructor(
    private readonly getProcessesUseCase: GetRecebimentoV2ProcessesUseCase,
  ) {}

  @Get('processes')
  @ApiOperation({
    summary: 'Listar cabeçalhos de processos de recebimento V2',
    operationId: 'getRecebimentoV2Processes',
  })
  handle(
    @Query() query: GetRecebimentoV2ProcessesQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.getProcessesUseCase.execute({
      unidadeId: query.unidadeId,
      cursor: query.cursor,
      limit: query.limit,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
