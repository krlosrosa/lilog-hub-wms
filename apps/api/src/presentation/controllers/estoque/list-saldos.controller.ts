import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListSaldosQueryDto,
  ListSaldosResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListSaldosUseCase } from '../../../application/usecases/estoque/list-saldos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/saldos')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListSaldosController {
  constructor(private readonly listSaldosUseCase: ListSaldosUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar saldos por unidade e depósito',
    operationId: 'listSaldos',
  })
  @ApiSuccessResponse(ListSaldosResponseDto)
  async handle(@Query() query: ListSaldosQueryDto) {
    const items = await this.listSaldosUseCase.execute(query);
    return { items };
  }
}
