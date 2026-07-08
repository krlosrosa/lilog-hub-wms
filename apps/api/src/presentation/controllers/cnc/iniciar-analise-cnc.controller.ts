import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CncResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { IniciarAnaliseCncUseCase } from '../../../application/usecases/cnc/iniciar-analise-cnc.usecase.js';
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
export class IniciarAnaliseCncController {
  constructor(
    private readonly iniciarAnaliseCncUseCase: IniciarAnaliseCncUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Auditable({ action: 'start-analysis', resource: 'cnc' })
  @Put(':id/iniciar-analise')
  @ApiOperation({
    summary: 'Iniciar análise da CNC',
    operationId: 'iniciarAnaliseCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(@Param('id') id: string, @Req() request: { user?: RequestUser }) {
    const user = getRequestUser(request);

    return this.iniciarAnaliseCncUseCase.execute({
      cncId: id,
      analistaId: user?.id ?? 0,
    });
  }
}
