import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarDemandasDevolucaoQueryDto,
  ListarDemandasDevolucaoResponseDto,
} from '../../../application/dtos/devolucao/listar-demandas-devolucao.dto.js';
import { ListarDemandasDevolucaoUseCase } from '../../../application/usecases/devolucao/listar-demandas-devolucao.usecase.js';
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
export class ListarDemandasDevolucaoController {
  constructor(
    private readonly listarDemandasDevolucaoUseCase: ListarDemandasDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar demandas de devolução da unidade',
    operationId: 'listarDemandasDevolucao',
  })
  @ApiSuccessResponse(ListarDemandasDevolucaoResponseDto)
  handle(@Query() query: ListarDemandasDevolucaoQueryDto) {
    return this.listarDemandasDevolucaoUseCase.execute(query);
  }
}
