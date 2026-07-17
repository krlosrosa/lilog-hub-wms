import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { FinalizarRecebimentoUseCase } from '../../../application/usecases/recebimento/finalizar-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
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
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class FinalizarRecebimentoController {
  constructor(
    private readonly finalizarRecebimentoUseCase: FinalizarRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.FINALIZAR)
  @Auditable({ action: 'finish', resource: 'recebimento' })
  @Put(':id/finalizar')
  @ApiOperation({
    summary: 'Finalizar recebimento',
    operationId: 'finalizarRecebimento',
  })
  @ApiSuccessResponse(Object)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.finalizarRecebimentoUseCase.execute({
      recebimentoId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
