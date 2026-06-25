import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { EncerrarConferenciaUseCase } from '../../../application/usecases/recebimento/encerrar-conferencia.usecase.js';
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
export class EncerrarConferenciaController {
  constructor(
    private readonly encerrarConferenciaUseCase: EncerrarConferenciaUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'encerrar', resource: 'recebimento' })
  @Put(':id/encerrar')
  @ApiOperation({
    summary: 'Encerrar conferência e calcular divergências',
    operationId: 'encerrarConferencia',
  })
  @ApiSuccessResponse(RecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.encerrarConferenciaUseCase.execute({
      recebimentoId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
