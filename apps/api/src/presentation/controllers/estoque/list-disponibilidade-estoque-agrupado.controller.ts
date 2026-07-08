import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDisponibilidadeEstoqueAgrupadoQueryDto,
  ListDisponibilidadeEstoqueAgrupadoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListDisponibilidadeEstoqueAgrupadoUseCase } from '../../../application/usecases/estoque/list-disponibilidade-estoque-agrupado.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/disponibilidade')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListDisponibilidadeEstoqueAgrupadoController {
  constructor(
    private readonly listDisponibilidadeEstoqueAgrupadoUseCase: ListDisponibilidadeEstoqueAgrupadoUseCase,
  ) {}

  @Get('agrupado')
  @ApiOperation({
    summary: 'Listar disponibilidade de estoque agrupada por produto e lote',
    operationId: 'listDisponibilidadeEstoqueAgrupado',
  })
  @ApiSuccessResponse(ListDisponibilidadeEstoqueAgrupadoResponseDto)
  async handle(@Query() query: ListDisponibilidadeEstoqueAgrupadoQueryDto) {
    return this.listDisponibilidadeEstoqueAgrupadoUseCase.execute(query);
  }
}
