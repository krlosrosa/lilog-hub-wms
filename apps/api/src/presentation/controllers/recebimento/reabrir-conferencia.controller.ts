import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { ReabrirConferenciaUseCase } from '../../../application/usecases/recebimento/reabrir-conferencia.usecase.js';
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
export class ReabrirConferenciaController {
  constructor(
    private readonly reabrirConferenciaUseCase: ReabrirConferenciaUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.ALTERAR)
  @Auditable({ action: 'reabrir', resource: 'recebimento' })
  @Put(':id/reabrir')
  @ApiOperation({
    summary: 'Reabrir conferência encerrada',
    operationId: 'reabrirConferencia',
  })
  @ApiSuccessResponse(RecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.reabrirConferenciaUseCase.execute({
      recebimentoId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
