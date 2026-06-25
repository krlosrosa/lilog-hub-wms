import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  MapaGrupoCodigoParamDto,
  MapaGrupoCodigoQueryDto,
  MapaGrupoCorteResponseDto,
} from '../../../application/dtos/corte-operacional/corte-operacional.dto.js';
import { BuscarMapaGrupoPorCodigoUseCase } from '../../../application/usecases/corte-operacional/buscar-mapa-grupo-por-codigo.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Corte Operacional')
@Controller('corte-operacional/mapas-grupo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarMapaGrupoPorCodigoController {
  constructor(
    private readonly buscarMapaGrupoPorCodigoUseCase: BuscarMapaGrupoPorCodigoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get(':codigo')
  @ApiOperation({
    summary: 'Buscar mapa-grupo por código (bipagem)',
    operationId: 'buscarMapaGrupoPorCodigoCorte',
  })
  @ApiSuccessResponse(MapaGrupoCorteResponseDto)
  handle(
    @Param() params: MapaGrupoCodigoParamDto,
    @Query() query: MapaGrupoCodigoQueryDto,
  ) {
    return this.buscarMapaGrupoPorCodigoUseCase.execute({
      codigo: params.codigo,
      unidadeId: query.unidadeId,
    });
  }
}
