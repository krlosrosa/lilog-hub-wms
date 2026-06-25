import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AddEquipeFuncionarioBodyDto,
} from '../../../application/dtos/sessao-operacao/equipe.dto.js';
import { EscalaFuncionarioDto } from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { AddEquipeFuncionarioUseCase } from '../../../application/usecases/sessao-operacao/add-equipe-funcionario.usecase.js';
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
@Controller('sessao-operacao/equipes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AddEquipeFuncionarioController {
  constructor(
    private readonly addEquipeFuncionarioUseCase: AddEquipeFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_CREATE)
  @Post(':id/funcionarios')
  @Auditable({ action: 'add', resource: 'equipe_funcionario' })
  @ApiOperation({
    summary: 'Add funcionario to equipe',
    operationId: 'addEquipeFuncionario',
  })
  @ApiSuccessResponse(EscalaFuncionarioDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: AddEquipeFuncionarioBodyDto,
  ) {
    return this.addEquipeFuncionarioUseCase.execute(id, body.funcionarioId);
  }
}
