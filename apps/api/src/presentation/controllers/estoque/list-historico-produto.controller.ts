import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListHistoricoProdutoQueryDto,
  ListHistoricoProdutoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListHistoricoProdutoUseCase } from '../../../application/usecases/estoque/list-historico-produto.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/historico')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListHistoricoProdutoController {
  constructor(
    private readonly listHistoricoProdutoUseCase: ListHistoricoProdutoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar histórico de movimentações de um produto',
    operationId: 'listHistoricoProduto',
  })
  @ApiSuccessResponse(ListHistoricoProdutoResponseDto)
  async handle(@Query() query: ListHistoricoProdutoQueryDto) {
    return this.listHistoricoProdutoUseCase.execute(query);
  }
}
