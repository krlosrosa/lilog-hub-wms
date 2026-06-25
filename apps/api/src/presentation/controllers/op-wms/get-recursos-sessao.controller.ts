import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  RecursosSessaoResponseDto,
  SessaoIdParamDto,
} from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { GetRecursosSessaoUseCase } from '../../../application/usecases/op-wms/get-recursos-sessao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('OP WMS')
@Controller('op-wms/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecursosSessaoController {
  constructor(
    private readonly getRecursosSessaoUseCase: GetRecursosSessaoUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':sessaoId/recursos')
  @ApiOperation({
    summary: 'Painel de recursos da sessão',
    operationId: 'getRecursosSessao',
  })
  @ApiSuccessResponse(RecursosSessaoResponseDto)
  handle(@Param() params: SessaoIdParamDto) {
    return this.getRecursosSessaoUseCase.execute(params.sessaoId);
  }
}
