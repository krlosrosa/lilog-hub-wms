import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SaldoEnderecoDetalheResponseDto } from '../../../application/dtos/estoque/estoque.dto.js';
import { GetSaldoEnderecoUseCase } from '../../../application/usecases/estoque/get-saldo-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetSaldoEnderecoController {
  constructor(
    private readonly getSaldoEnderecoUseCase: GetSaldoEnderecoUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obter saldo por endereço',
    operationId: 'getSaldoEndereco',
  })
  @ApiSuccessResponse(SaldoEnderecoDetalheResponseDto)
  handle(@Param('id') id: string) {
    return this.getSaldoEnderecoUseCase.execute(id);
  }
}
