import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DevolucaoSessaoIdParamDto,
  RecursosDevolucaoSessaoResponseDto,
} from '../../../application/dtos/devolucao/recursos-devolucao-sessao.dto.js';
import { GetRecursosDevolucaoSessaoUseCase } from '../../../application/usecases/devolucao/get-recursos-devolucao-sessao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Devolucao')
@Controller('devolucao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecursosDevolucaoSessaoController {
  constructor(
    private readonly getRecursosDevolucaoSessaoUseCase: GetRecursosDevolucaoSessaoUseCase,
  ) {}

  @RequirePermissions(
    DEVOLUCAO_PERMISSION.VISUALIZAR,
    USER_PERMISSION.SESSAO_OPERACAO_VIEW,
  )
  @Get(':sessaoId/recursos')
  @ApiOperation({
    summary: 'Painel de recursos de devolução da sessão',
    operationId: 'getRecursosDevolucaoSessao',
  })
  @ApiSuccessResponse(RecursosDevolucaoSessaoResponseDto)
  handle(@Param() params: DevolucaoSessaoIdParamDto) {
    return this.getRecursosDevolucaoSessaoUseCase.execute(params.sessaoId);
  }
}
