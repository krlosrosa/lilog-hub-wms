import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProdutoResponseDto } from '../../../application/dtos/produto/produto.dto.js';
import { GetProdutoUseCase } from '../../../application/usecases/produto/get-produto.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Produto')
@Controller('produtos')
@ApiErrorResponses()
export class GetProdutoController {
  constructor(private readonly getProdutoUseCase: GetProdutoUseCase) {}

  @Get(':produtoId')
  @ApiOperation({
    summary: 'Get produto by id',
    operationId: 'getProduto',
  })
  @ApiSuccessResponse(ProdutoResponseDto)
  handle(@Param('produtoId') produtoId: string) {
    return this.getProdutoUseCase.execute(produtoId);
  }
}
