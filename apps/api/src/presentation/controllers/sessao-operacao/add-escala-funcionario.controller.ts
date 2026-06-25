import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AddEscalaFuncionarioBodyDto,
  AddEscalaFuncionariosResponseDto,
} from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { AddEscalaFuncionarioUseCase } from '../../../application/usecases/sessao-operacao/add-escala-funcionario.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/escalas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AddEscalaFuncionarioController {
  constructor(
    private readonly addEscalaFuncionarioUseCase: AddEscalaFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post(':id/funcionarios')
  @Auditable({ action: 'add', resource: 'escala_funcionario' })
  @ApiOperation({
    summary: 'Add funcionarios to escala',
    operationId: 'addEscalaFuncionarios',
  })
  @ApiSuccessResponse(AddEscalaFuncionariosResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: AddEscalaFuncionarioBodyDto,
  ) {
    return this.addEscalaFuncionarioUseCase.execute(id, body.funcionarioIds);
  }
}
