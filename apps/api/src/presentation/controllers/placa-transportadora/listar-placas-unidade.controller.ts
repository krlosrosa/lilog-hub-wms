import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListPlacasResponseDto,
  ListPlacasUnidadeQueryDto,
} from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { ListarPlacasUnidadeUseCase } from '../../../application/usecases/placa-transportadora/listar-placas-unidade.usecase.js';
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
export class ListarPlacasUnidadeController {
  constructor(
    private readonly listarPlacasUnidadeUseCase: ListarPlacasUnidadeUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.VIEW)
  @Get('placas')
  @ApiOperation({
    summary: 'List all placas by unidade',
    operationId: 'listPlacasUnidade',
  })
  @ApiSuccessResponse(ListPlacasResponseDto)
  handle(@Query() query: ListPlacasUnidadeQueryDto) {
    return this.listarPlacasUnidadeUseCase.execute({
      unidadeId: query.unidadeId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      tipoVeiculo: query.tipoVeiculo,
    });
  }
}
