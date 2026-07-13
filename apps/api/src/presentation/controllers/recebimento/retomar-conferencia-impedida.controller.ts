import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { RetomarConferenciaImpedidaUseCase } from '../../../application/usecases/recebimento/retomar-conferencia-impedida.usecase.js';
import {
  ApiErrorResponses,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RetomarConferenciaImpedidaController {
  constructor(
    private readonly retomarConferenciaImpedidaUseCase: RetomarConferenciaImpedidaUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'retomar-conferencia', resource: 'pre-recebimento' })
  @Put(':id/retomar-conferencia')
  @ApiOperation({
    summary: 'Resume conference after impedimento',
    operationId: 'retomarConferenciaImpedida',
  })
  @ApiResponse({ status: 200, description: 'Conferência retomada' })
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.retomarConferenciaImpedidaUseCase.execute({
      preRecebimentoId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
