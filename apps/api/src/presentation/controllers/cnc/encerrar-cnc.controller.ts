import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CncResponseDto,
  EncerrarCncBodyDto,
} from '../../../application/dtos/cnc/list-cncs.dto.js';
import { EncerrarCncUseCase } from '../../../application/usecases/cnc/encerrar-cnc.usecase.js';
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
export class EncerrarCncController {
  constructor(private readonly encerrarCncUseCase: EncerrarCncUseCase) {}

  @RequirePermissions(CNC_PERMISSION.ENCERRAR)
  @Auditable({ action: 'close', resource: 'cnc' })
  @Put(':id/encerrar')
  @ApiOperation({
    summary: 'Encerrar CNC após tratativas',
    operationId: 'encerrarCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: EncerrarCncBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.encerrarCncUseCase.execute({
      cncId: id,
      encerradoPorUserId: user?.id ?? 0,
      ...body,
    });
  }
}
