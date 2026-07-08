import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CreateDepositoBodyDto,
  DepositoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { CreateDepositoUseCase } from '../../../application/usecases/estoque/create-deposito.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/depositos')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class CreateDepositoController {
  constructor(private readonly createDepositoUseCase: CreateDepositoUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Criar depósito lógico customizado',
    operationId: 'createDeposito',
  })
  @ApiSuccessResponse(DepositoResponseDto, 'created')
  handle(@Body() body: CreateDepositoBodyDto) {
    return this.createDepositoUseCase.execute(body);
  }
}
