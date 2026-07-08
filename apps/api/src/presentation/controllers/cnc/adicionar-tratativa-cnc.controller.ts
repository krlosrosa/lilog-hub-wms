import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AdicionarTratativaCncBodyDto,
  CncTratativaResponseDto,
} from '../../../application/dtos/cnc/list-cncs.dto.js';
import { AdicionarTratativaCncUseCase } from '../../../application/usecases/cnc/adicionar-tratativa-cnc.usecase.js';
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
export class AdicionarTratativaCncController {
  constructor(
    private readonly adicionarTratativaCncUseCase: AdicionarTratativaCncUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Auditable({ action: 'add-treatment', resource: 'cnc' })
  @Post(':id/tratativas')
  @ApiOperation({
    summary: 'Adicionar tratativa à CNC',
    operationId: 'adicionarTratativaCnc',
  })
  @ApiSuccessResponse(CncTratativaResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: AdicionarTratativaCncBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.adicionarTratativaCncUseCase.execute({
      cncId: id,
      criadoPorUserId: user?.id ?? 0,
      ...body,
    });
  }
}
