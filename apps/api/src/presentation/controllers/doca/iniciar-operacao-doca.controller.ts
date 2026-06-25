import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { OperacaoDocaResponseDto } from '../../../application/dtos/doca/operacao-doca.dto.js';
import { IniciarOperacaoDocaUseCase } from '../../../application/usecases/operacao-doca/iniciar-operacao-doca.usecase.js';
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
export class IniciarOperacaoDocaController {
  constructor(
    private readonly iniciarOperacaoDocaUseCase: IniciarOperacaoDocaUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.OPERACAO_START)
  @Auditable({ action: 'start', resource: 'operacao-doca' })
  @Patch(':id/iniciar')
  @ApiOperation({
    summary: 'Start operacao doca',
    operationId: 'iniciarOperacaoDoca',
  })
  @ApiSuccessResponse(OperacaoDocaResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.iniciarOperacaoDocaUseCase.execute({
      id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
