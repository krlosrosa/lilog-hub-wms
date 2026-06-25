import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDepositosQueryDto,
  ListDepositosResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListDepositosUseCase } from '../../../application/usecases/estoque/list-depositos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/depositos')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListDepositosController {
  constructor(private readonly listDepositosUseCase: ListDepositosUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar depósitos lógicos da unidade',
    operationId: 'listDepositos',
  })
  @ApiSuccessResponse(ListDepositosResponseDto)
  async handle(@Query() query: ListDepositosQueryDto) {
    const items = await this.listDepositosUseCase.execute(query.unidadeId);
    return { items };
  }
}
