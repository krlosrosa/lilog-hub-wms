import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListSaldosEnderecoQueryDto,
  ListSaldosEnderecoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListSaldosEnderecoUseCase } from '../../../application/usecases/estoque/list-saldos-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListSaldosEnderecoController {
  constructor(
    private readonly listSaldosEnderecoUseCase: ListSaldosEnderecoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar saldos por endereço',
    operationId: 'listSaldosEndereco',
  })
  @ApiSuccessResponse(ListSaldosEnderecoResponseDto)
  async handle(@Query() query: ListSaldosEnderecoQueryDto) {
    const items = await this.listSaldosEnderecoUseCase.execute(query);
    return { items };
  }
}
