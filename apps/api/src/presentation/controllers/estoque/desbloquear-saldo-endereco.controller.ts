import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SaldoEnderecoResponseDto } from '../../../application/dtos/estoque/estoque.dto.js';
import { DesbloquearSaldoEnderecoUseCase } from '../../../application/usecases/estoque/desbloquear-saldo-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const DesbloquearSaldoEnderecoBodySchema = z.object({
  observacao: z.string().max(255).optional(),
});

class DesbloquearSaldoEnderecoBodyDto extends createZodDto(
  DesbloquearSaldoEnderecoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DesbloquearSaldoEnderecoController {
  constructor(
    private readonly desbloquearSaldoEnderecoUseCase: DesbloquearSaldoEnderecoUseCase,
  ) {}

  @Post(':id/desbloquear')
  @ApiOperation({
    summary: 'Desbloquear saldo por endereço',
    operationId: 'desbloquearSaldoEndereco',
  })
  @ApiSuccessResponse(SaldoEnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: DesbloquearSaldoEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.desbloquearSaldoEnderecoUseCase.execute({
      saldoEnderecoId: id,
      observacao: body.observacao,
      operatorId: getRequestUser(request)?.id ?? null,
    });
  }
}
