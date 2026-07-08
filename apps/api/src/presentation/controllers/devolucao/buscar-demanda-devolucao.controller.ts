import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  BuscarDemandaDevolucaoQueryDto,
  BuscarDemandaDevolucaoResponseDto,
} from '../../../application/dtos/devolucao/buscar-demanda-devolucao.dto.js';
import { BuscarDemandaDevolucaoUseCase } from '../../../application/usecases/devolucao/buscar-demanda-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarDemandaDevolucaoController {
  constructor(
    private readonly buscarDemandaDevolucaoUseCase: BuscarDemandaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhe de uma demanda de devolução',
    operationId: 'buscarDemandaDevolucao',
  })
  @ApiSuccessResponse(BuscarDemandaDevolucaoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: BuscarDemandaDevolucaoQueryDto,
  ) {
    return this.buscarDemandaDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
    });
  }
}
