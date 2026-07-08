import { Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CncTratativaResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { ConcluirTratativaCncUseCase } from '../../../application/usecases/cnc/concluir-tratativa-cnc.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ConcluirTratativaCncController {
  constructor(
    private readonly concluirTratativaCncUseCase: ConcluirTratativaCncUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Auditable({ action: 'complete-treatment', resource: 'cnc' })
  @Put(':id/tratativas/:tratativaId/concluir')
  @ApiOperation({
    summary: 'Concluir tratativa da CNC',
    operationId: 'concluirTratativaCnc',
  })
  @ApiSuccessResponse(CncTratativaResponseDto)
  handle(
    @Param('id') id: string,
    @Param('tratativaId') tratativaId: string,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.concluirTratativaCncUseCase.execute({
      cncId: id,
      tratativaId,
      concluidaPorUserId: user?.id ?? 0,
    });
  }
}
