import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DepositoResponseDto,
  UpdateDepositoBodyDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { UpdateDepositoUseCase } from '../../../application/usecases/estoque/update-deposito.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/depositos')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class UpdateDepositoController {
  constructor(private readonly updateDepositoUseCase: UpdateDepositoUseCase) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar depósito lógico',
    operationId: 'updateDeposito',
  })
  @ApiSuccessResponse(DepositoResponseDto)
  handle(@Param('id') id: string, @Body() body: UpdateDepositoBodyDto) {
    return this.updateDepositoUseCase.execute(id, body);
  }
}
