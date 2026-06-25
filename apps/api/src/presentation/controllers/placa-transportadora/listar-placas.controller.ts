import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListPlacasQueryDto,
  ListPlacasResponseDto,
} from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { ListarPlacasUseCase } from '../../../application/usecases/placa-transportadora/listar-placas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarPlacasController {
  constructor(private readonly listarPlacasUseCase: ListarPlacasUseCase) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.VIEW)
  @Get(':transportadoraId/placas')
  @ApiOperation({
    summary: 'List placas by transportadora',
    operationId: 'listPlacasTransportadora',
  })
  @ApiSuccessResponse(ListPlacasResponseDto)
  handle(
    @Param('transportadoraId') transportadoraId: string,
    @Query() query: ListPlacasQueryDto,
  ) {
    return this.listarPlacasUseCase.execute({
      transportadoraId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      tipoVeiculo: query.tipoVeiculo,
    });
  }
}
