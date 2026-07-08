import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { SaldoEnderecoResponseDto } from '../../../application/dtos/estoque/estoque.dto.js';
import { BloquearSaldoEnderecoBodySchema } from '../../../application/dtos/estoque/estoque.dto.js';
import { BloquearSaldoEnderecoUseCase } from '../../../application/usecases/estoque/bloquear-saldo-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

class BloquearSaldoEnderecoBodyDto extends createZodDto(
  BloquearSaldoEnderecoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BloquearSaldoEnderecoController {
  constructor(
    private readonly bloquearSaldoEnderecoUseCase: BloquearSaldoEnderecoUseCase,
  ) {}

  @Post(':id/bloquear')
  @ApiOperation({
    summary: 'Bloquear saldo por endereço',
    operationId: 'bloquearSaldoEndereco',
  })
  @ApiSuccessResponse(SaldoEnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: BloquearSaldoEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.bloquearSaldoEnderecoUseCase.execute({
      saldoEnderecoId: id,
      motivoBloqueioId: body.motivoBloqueioId,
      quantidade: body.quantidade,
      observacao: body.observacao,
      operatorId: getRequestUser(request)?.id ?? null,
    });
  }
}
