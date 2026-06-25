import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarMapasLotesQueryDto,
  ListarMapasLotesResponseDto,
} from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import { ListarMapasLotesUseCase } from '../../../application/usecases/expedicao/listar-mapas-lotes.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarMapasLotesController {
  constructor(
    private readonly listarMapasLotesUseCase: ListarMapasLotesUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar lotes de mapas por transportes',
    operationId: 'listarMapasLotes',
  })
  @ApiSuccessResponse(ListarMapasLotesResponseDto)
  handle(@Query() query: ListarMapasLotesQueryDto) {
    return this.listarMapasLotesUseCase.execute(query);
  }
}
