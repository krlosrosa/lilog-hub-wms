import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CancelarCncBodyDto,
  CncResponseDto,
} from '../../../application/dtos/cnc/list-cncs.dto.js';
import { CancelarCncUseCase } from '../../../application/usecases/cnc/cancelar-cnc.usecase.js';
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
export class CancelarCncController {
  constructor(private readonly cancelarCncUseCase: CancelarCncUseCase) {}

  @RequirePermissions(CNC_PERMISSION.CANCELAR)
  @Auditable({ action: 'cancel', resource: 'cnc' })
  @Put(':id/cancelar')
  @ApiOperation({
    summary: 'Cancelar CNC',
    operationId: 'cancelarCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: CancelarCncBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.cancelarCncUseCase.execute({
      cncId: id,
      userId: user?.id ?? 0,
      observacao: body.observacao,
    });
  }
}
