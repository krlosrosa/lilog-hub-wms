import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { AprovarRecebimentoUseCase } from '../../../application/usecases/recebimento/aprovar-recebimento.usecase.js';
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
export class AprovarRecebimentoController {
  constructor(
    private readonly aprovarRecebimentoUseCase: AprovarRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.APROVAR)
  @Auditable({ action: 'approve', resource: 'recebimento' })
  @Put(':id/aprovar')
  @ApiOperation({
    summary: 'Aprovar recebimento com divergências',
    operationId: 'aprovarRecebimento',
  })
  @ApiSuccessResponse(RecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.aprovarRecebimentoUseCase.execute({
      recebimentoId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
