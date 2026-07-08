import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MotivoBloqueioSaldoResponseDto } from '../../../application/dtos/estoque/estoque.dto.js';
import { UpdateMotivoBloqueioSaldoUseCase } from '../../../application/usecases/estoque/update-motivo-bloqueio-saldo.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const UpdateMotivoBloqueioSaldoBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(255).nullable().optional(),
  ativo: z.boolean().optional(),
});

class UpdateMotivoBloqueioSaldoBodyDto extends createZodDto(
  UpdateMotivoBloqueioSaldoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/motivos-bloqueio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateMotivoBloqueioSaldoController {
  constructor(
    private readonly updateMotivoBloqueioSaldoUseCase: UpdateMotivoBloqueioSaldoUseCase,
  ) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar motivo de bloqueio de saldo',
    operationId: 'updateMotivoBloqueioSaldo',
  })
  @ApiSuccessResponse(MotivoBloqueioSaldoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateMotivoBloqueioSaldoBodyDto,
  ) {
    return this.updateMotivoBloqueioSaldoUseCase.execute({ id, data: body });
  }
}
