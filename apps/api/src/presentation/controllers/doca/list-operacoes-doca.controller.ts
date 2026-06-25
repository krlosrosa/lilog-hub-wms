import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListOperacoesDocaQueryDto,
  ListOperacoesDocaResponseDto,
} from '../../../application/dtos/doca/operacao-doca.dto.js';
import { ListOperacoesDocaUseCase } from '../../../application/usecases/operacao-doca/list-operacoes-doca.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Doca')
@Controller('docas/operacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListOperacoesDocaController {
  constructor(
    private readonly listOperacoesDocaUseCase: ListOperacoesDocaUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.OPERACAO_VIEW)
  @Get()
  @ApiOperation({
    summary: 'List operacoes doca',
    operationId: 'listOperacoesDoca',
  })
  @ApiSuccessResponse(ListOperacoesDocaResponseDto)
  handle(@Query() query: ListOperacoesDocaQueryDto) {
    return this.listOperacoesDocaUseCase.execute(query);
  }
}
