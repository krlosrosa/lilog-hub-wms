import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FuncionarioResponseDto } from '../../../application/dtos/funcionario/list-funcionarios.dto.js';
import { BlockFuncionarioUseCase } from '../../../application/usecases/funcionario/block-funcionario.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Funcionario')
@Controller('funcionarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BlockFuncionarioController {
  constructor(
    private readonly blockFuncionarioUseCase: BlockFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_BLOCK)
  @Auditable({ action: 'block', resource: 'funcionario' })
  @Patch(':id/block')
  @ApiOperation({
    summary: 'Block funcionario',
    operationId: 'blockFuncionario',
  })
  @ApiSuccessResponse(FuncionarioResponseDto)
  handle(@Param('id') id: string) {
    return this.blockFuncionarioUseCase.execute(Number(id));
  }
}
