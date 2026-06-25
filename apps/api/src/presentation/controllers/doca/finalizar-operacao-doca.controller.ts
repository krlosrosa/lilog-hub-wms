import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { OperacaoDocaResponseDto } from '../../../application/dtos/doca/operacao-doca.dto.js';
import { FinalizarOperacaoDocaUseCase } from '../../../application/usecases/operacao-doca/finalizar-operacao-doca.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Doca')
@Controller('docas/operacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class FinalizarOperacaoDocaController {
  constructor(
    private readonly finalizarOperacaoDocaUseCase: FinalizarOperacaoDocaUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.OPERACAO_FINISH)
  @Auditable({ action: 'finish', resource: 'operacao-doca' })
  @Patch(':id/finalizar')
  @ApiOperation({
    summary: 'Finish operacao doca',
    operationId: 'finalizarOperacaoDoca',
  })
  @ApiSuccessResponse(OperacaoDocaResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.finalizarOperacaoDocaUseCase.execute({
      id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
