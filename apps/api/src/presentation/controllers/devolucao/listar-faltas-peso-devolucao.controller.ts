import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarFaltasPesoQueryDto,
  ListarFaltasPesoResponseDto,
} from '../../../application/dtos/devolucao/falta-peso-devolucao.dto.js';
import { ListarFaltasPesoDevolucaoUseCase } from '../../../application/usecases/devolucao/listar-faltas-peso-devolucao.usecase.js';
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
export class ListarFaltasPesoDevolucaoController {
  constructor(
    private readonly listarFaltasPesoDevolucaoUseCase: ListarFaltasPesoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get(':id/faltas-peso')
  @ApiOperation({
    summary: 'Listar faltas de peso de uma demanda de devolução',
    operationId: 'listarFaltasPesoDevolucao',
  })
  @ApiSuccessResponse(ListarFaltasPesoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: ListarFaltasPesoQueryDto,
  ) {
    return this.listarFaltasPesoDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
      status: query.status,
    });
  }
}
