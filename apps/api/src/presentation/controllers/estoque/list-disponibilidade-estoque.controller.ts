import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDisponibilidadeEstoqueQueryDto,
  ListDisponibilidadeEstoqueResponseDto,
  ListGruposDisponibilidadeEstoqueQueryDto,
  ListGruposDisponibilidadeEstoqueResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListDisponibilidadeEstoqueUseCase } from '../../../application/usecases/estoque/list-disponibilidade-estoque.usecase.js';
import { ListGruposDisponibilidadeEstoqueUseCase } from '../../../application/usecases/estoque/list-grupos-disponibilidade-estoque.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/disponibilidade')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListDisponibilidadeEstoqueController {
  constructor(
    private readonly listDisponibilidadeEstoqueUseCase: ListDisponibilidadeEstoqueUseCase,
    private readonly listGruposDisponibilidadeEstoqueUseCase: ListGruposDisponibilidadeEstoqueUseCase,
  ) {}

  @Get('grupos')
  @ApiOperation({
    summary: 'Listar grupos de SKU com saldo na unidade',
    operationId: 'listGruposDisponibilidadeEstoque',
  })
  @ApiSuccessResponse(ListGruposDisponibilidadeEstoqueResponseDto)
  async listGrupos(@Query() query: ListGruposDisponibilidadeEstoqueQueryDto) {
    return this.listGruposDisponibilidadeEstoqueUseCase.execute(query.unidadeId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar disponibilidade de estoque agregada',
    operationId: 'listDisponibilidadeEstoque',
  })
  @ApiSuccessResponse(ListDisponibilidadeEstoqueResponseDto)
  async handle(@Query() query: ListDisponibilidadeEstoqueQueryDto) {
    return this.listDisponibilidadeEstoqueUseCase.execute(query);
  }
}
