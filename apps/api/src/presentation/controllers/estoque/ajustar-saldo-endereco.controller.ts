import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import {
  AjustarSaldoEnderecoBodySchema,
  SaldoEnderecoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { AjustarSaldoEnderecoUseCase } from '../../../application/usecases/estoque/ajustar-saldo-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

class AjustarSaldoEnderecoBodyDto extends createZodDto(
  AjustarSaldoEnderecoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AjustarSaldoEnderecoController {
  constructor(
    private readonly ajustarSaldoEnderecoUseCase: AjustarSaldoEnderecoUseCase,
  ) {}

  @Post(':id/ajustar')
  @ApiOperation({
    summary: 'Ajustar quantidade de saldo por endereço',
    operationId: 'ajustarSaldoEndereco',
  })
  @ApiSuccessResponse(SaldoEnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: AjustarSaldoEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.ajustarSaldoEnderecoUseCase.execute({
      saldoEnderecoId: id,
      novaQuantidade: body.novaQuantidade,
      motivo: body.motivo,
      operatorId: getRequestUser(request)?.id ?? null,
    });
  }
}
