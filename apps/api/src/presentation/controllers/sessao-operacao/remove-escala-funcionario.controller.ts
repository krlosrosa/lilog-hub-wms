import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RemoveEscalaFuncionarioUseCase } from '../../../application/usecases/sessao-operacao/remove-escala-funcionario.usecase.js';
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
export class RemoveEscalaFuncionarioController {
  constructor(
    private readonly removeEscalaFuncionarioUseCase: RemoveEscalaFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Delete(':id/funcionarios/:funcionarioId')
  @Auditable({ action: 'remove', resource: 'escala_funcionario' })
  @ApiOperation({
    summary: 'Remove funcionario from escala',
    operationId: 'removeEscalaFuncionario',
  })
  @ApiSuccessResponse(Object)
  handle(
    @Param('id') id: string,
    @Param('funcionarioId') funcionarioId: string,
  ) {
    return this.removeEscalaFuncionarioUseCase.execute(
      id,
      Number(funcionarioId),
    );
  }
}
