import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarAvariasDemandaQueryDto,
  ListarAvariasDetalheResponseDto,
} from '../../../application/dtos/devolucao/buscar-demanda-devolucao.dto.js';
import { ListarAvariasDemandaUseCase } from '../../../application/usecases/devolucao/listar-avarias-demanda.usecase.js';
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
export class ListarAvariasDemandaDevolucaoController {
  constructor(
    private readonly listarAvariasDemandaUseCase: ListarAvariasDemandaUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get(':id/avarias')
  @ApiOperation({
    summary: 'Listar avarias de uma demanda de devolução',
    operationId: 'listarAvariasDemandaDevolucao',
  })
  @ApiSuccessResponse(ListarAvariasDetalheResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: ListarAvariasDemandaQueryDto,
  ) {
    return this.listarAvariasDemandaUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
    });
  }
}
