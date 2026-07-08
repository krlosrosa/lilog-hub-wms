import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ObterExposicaoEstoqueQueryDto,
  ObterExposicaoEstoqueResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ObterExposicaoEstoqueUseCase } from '../../../application/usecases/estoque/obter-exposicao-estoque.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/exposicao')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ObterExposicaoEstoqueController {
  constructor(
    private readonly obterExposicaoEstoqueUseCase: ObterExposicaoEstoqueUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obter exposição de estoque (CNC e débito de devolução em aberto)',
    operationId: 'obterExposicaoEstoque',
  })
  @ApiSuccessResponse(ObterExposicaoEstoqueResponseDto)
  async handle(@Query() query: ObterExposicaoEstoqueQueryDto) {
    return this.obterExposicaoEstoqueUseCase.execute({
      unidadeId: query.unidadeId,
    });
  }
}
