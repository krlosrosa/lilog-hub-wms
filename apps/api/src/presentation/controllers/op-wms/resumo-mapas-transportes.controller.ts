import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ResumoMapasTransportesQueryDto,
  ResumoMapasTransportesResponseDto,
} from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { ResumoMapasTransportesUseCase } from '../../../application/usecases/op-wms/resumo-mapas-transportes.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('OP WMS')
@Controller('op-wms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ResumoMapasTransportesController {
  constructor(
    private readonly resumoMapasTransportesUseCase: ResumoMapasTransportesUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Get('mapas-resumo-transportes')
  @ApiOperation({
    summary: 'Resumo agregado de mapas disponíveis por transporte',
    operationId: 'getMapasResumoTransportes',
  })
  @ApiSuccessResponse(ResumoMapasTransportesResponseDto)
  handle(@Query() query: ResumoMapasTransportesQueryDto) {
    return this.resumoMapasTransportesUseCase.execute(query);
  }
}
