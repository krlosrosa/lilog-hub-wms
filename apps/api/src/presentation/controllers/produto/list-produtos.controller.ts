import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListProdutosQueryDto,
  ListProdutosResponseDto,
} from '../../../application/dtos/produto/produto.dto.js';
import { ListProdutosUseCase } from '../../../application/usecases/produto/list-produtos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Produto')
@Controller('produtos')
@ApiErrorResponses()
export class ListProdutosController {
  constructor(private readonly listProdutosUseCase: ListProdutosUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List produtos',
    operationId: 'listProdutos',
  })
  @ApiSuccessResponse(ListProdutosResponseDto)
  handle(@Query() query: ListProdutosQueryDto) {
    return this.listProdutosUseCase.execute(query);
  }
}
