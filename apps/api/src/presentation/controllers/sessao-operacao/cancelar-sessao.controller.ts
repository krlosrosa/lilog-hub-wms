import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SessaoDetailDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { CancelarSessaoUseCase } from '../../../application/usecases/sessao-operacao/cancelar-sessao.usecase.js';
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
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CancelarSessaoController {
  constructor(private readonly cancelarSessaoUseCase: CancelarSessaoUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Patch(':id/cancelar')
  @Auditable({ action: 'cancel', resource: 'sessao_trabalho' })
  @ApiOperation({
    summary: 'Cancelar sessao de trabalho',
    operationId: 'cancelarSessao',
  })
  @ApiSuccessResponse(SessaoDetailDto)
  handle(@Param('id') id: string) {
    return this.cancelarSessaoUseCase.execute(id);
  }
}
