import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListRecebimentosQueryDto,
  ListRecebimentosResponseDto,
} from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { ListRecebimentosUseCase } from '../../../application/usecases/recebimento/list-recebimentos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListRecebimentosController {
  constructor(
    private readonly listRecebimentosUseCase: ListRecebimentosUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'List recebimentos',
    operationId: 'listRecebimentos',
  })
  @ApiSuccessResponse(ListRecebimentosResponseDto)
  handle(@Query() query: ListRecebimentosQueryDto) {
    return this.listRecebimentosUseCase.execute({
      ...query,
      dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,
      dataFim: query.dataFim ? new Date(query.dataFim) : undefined,
    });
  }
}
