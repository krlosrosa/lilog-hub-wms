import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListEscalasQueryDto,
  ListEscalasResponseDto,
} from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { ListEscalasUseCase } from '../../../application/usecases/sessao-operacao/list-escalas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/escalas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListEscalasController {
  constructor(private readonly listEscalasUseCase: ListEscalasUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get()
  @ApiOperation({ summary: 'List escalas de trabalho', operationId: 'listEscalas' })
  @ApiSuccessResponse(ListEscalasResponseDto)
  handle(@Query() query: ListEscalasQueryDto) {
    return this.listEscalasUseCase.execute(query);
  }
}
