import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListEscalaFuncionariosResponseDto } from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { ListEscalaFuncionariosUseCase } from '../../../application/usecases/sessao-operacao/list-escala-funcionarios.usecase.js';
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
export class ListEscalaFuncionariosController {
  constructor(
    private readonly listEscalaFuncionariosUseCase: ListEscalaFuncionariosUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':id/funcionarios')
  @ApiOperation({
    summary: 'List funcionarios da escala',
    operationId: 'listEscalaFuncionarios',
  })
  @ApiSuccessResponse(ListEscalaFuncionariosResponseDto)
  handle(@Param('id') id: string) {
    return this.listEscalaFuncionariosUseCase.execute(id);
  }
}
