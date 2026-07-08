import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { MotivoBloqueioSaldoResponseDto } from '../../../application/dtos/estoque/estoque.dto.js';
import { CreateMotivoBloqueioSaldoUseCase } from '../../../application/usecases/estoque/create-motivo-bloqueio-saldo.usecase.js';
import { OrigemMotivoBloqueioSaldoSchema } from '../../../domain/model/estoque/motivo-bloqueio-saldo.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateMotivoBloqueioSaldoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  descricao: z.string().max(255).optional(),
  origem: OrigemMotivoBloqueioSaldoSchema.default('manual'),
});

class CreateMotivoBloqueioSaldoBodyDto extends createZodDto(
  CreateMotivoBloqueioSaldoBodySchema,
) {}

@ApiTags('Estoque')
@Controller('estoque/motivos-bloqueio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateMotivoBloqueioSaldoController {
  constructor(
    private readonly createMotivoBloqueioSaldoUseCase: CreateMotivoBloqueioSaldoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar motivo de bloqueio de saldo',
    operationId: 'createMotivoBloqueioSaldo',
  })
  @ApiSuccessResponse(MotivoBloqueioSaldoResponseDto, 'created')
  handle(@Body() body: CreateMotivoBloqueioSaldoBodyDto) {
    return this.createMotivoBloqueioSaldoUseCase.execute({ data: body });
  }
}
