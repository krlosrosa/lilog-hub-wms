import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { CancelPreRecebimentoUseCase } from '../../../application/usecases/recebimento/cancel-pre-recebimento.usecase.js';
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
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CancelPreRecebimentoController {
  constructor(
    private readonly cancelPreRecebimentoUseCase: CancelPreRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CANCELAR)
  @Auditable({ action: 'cancel', resource: 'pre-recebimento' })
  @Put(':id/cancelar')
  @ApiOperation({
    summary: 'Cancel pre-recebimento',
    operationId: 'cancelPreRecebimento',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.cancelPreRecebimentoUseCase.execute({
      id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
