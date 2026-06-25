import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DocaActionBodyDto,
  DocaResponseDto,
} from '../../../application/dtos/doca/doca.dto.js';
import { SetMaintenanceDocaUseCase } from '../../../application/usecases/doca/set-maintenance-doca.usecase.js';
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
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SetMaintenanceDocaController {
  constructor(
    private readonly setMaintenanceDocaUseCase: SetMaintenanceDocaUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_UPDATE)
  @Auditable({ action: 'maintenance', resource: 'doca' })
  @Patch(':id/manutencao')
  @ApiOperation({
    summary: 'Set doca maintenance',
    operationId: 'setMaintenanceDoca',
  })
  @ApiSuccessResponse(DocaResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: DocaActionBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.setMaintenanceDocaUseCase.execute({
      id,
      motivo: body.motivo,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
