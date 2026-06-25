import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarTransportesQueryDto,
  ListarTransportesResponseDto,
} from '../../../application/dtos/expedicao/listar-transportes.dto.js';
import { ListarTransportesUseCase } from '../../../application/usecases/expedicao/listar-transportes.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarTransportesController {
  constructor(
    private readonly listarTransportesUseCase: ListarTransportesUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar transportes da unidade',
    operationId: 'listarTransportes',
  })
  @ApiSuccessResponse(ListarTransportesResponseDto)
  handle(@Query() query: ListarTransportesQueryDto) {
    return this.listarTransportesUseCase.execute(query);
  }
}
