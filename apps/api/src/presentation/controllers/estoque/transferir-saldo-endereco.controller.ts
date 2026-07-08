import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import {
  SaldoEnderecoResponseDto,
  TransferirSaldoEnderecoBodySchema,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { TransferirSaldoEnderecoUseCase } from '../../../application/usecases/estoque/transferir-saldo-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

class TransferirSaldoEnderecoBodyDto extends createZodDto(
  TransferirSaldoEnderecoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/saldos-endereco')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class TransferirSaldoEnderecoController {
  constructor(
    private readonly transferirSaldoEnderecoUseCase: TransferirSaldoEnderecoUseCase,
  ) {}

  @Post(':id/transferir')
  @ApiOperation({
    summary: 'Transferir saldo para outra posição',
    operationId: 'transferirSaldoEndereco',
  })
  @ApiSuccessResponse(SaldoEnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: TransferirSaldoEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.transferirSaldoEnderecoUseCase.execute({
      saldoEnderecoId: id,
      enderecoDestinoId: body.enderecoDestinoId,
      quantidade: body.quantidade,
      observacao: body.observacao,
      operatorId: getRequestUser(request)?.id ?? null,
    });
  }
}
