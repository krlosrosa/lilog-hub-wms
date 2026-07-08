import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TarefaArmazenagemResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { ConfirmarTarefaArmazenagemUseCase } from '../../../application/usecases/armazenagem/confirmar-tarefa-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const ConfirmarTarefaParamsSchema = z.object({
  id: z.uuid(),
  tarefaId: z.uuid(),
});

class ConfirmarTarefaParamsDto extends createZodDto(ConfirmarTarefaParamsSchema) {}

const ConfirmarTarefaBodySchema = z.object({
  enderecoConfirmadoId: z.uuid(),
  unitizadorCodigo: z.string().min(1).optional(),
  motivoDivergencia: z.string().min(1).max(500).optional(),
});

class ConfirmarTarefaBodyDto extends createZodDto(ConfirmarTarefaBodySchema) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConfirmarTarefaArmazenagemController {
  constructor(
    private readonly confirmarTarefaArmazenagemUseCase: ConfirmarTarefaArmazenagemUseCase,
  ) {}

  @Post(':id/tarefas/:tarefaId/confirmar')
  @ApiOperation({
    summary: 'Confirm storage task (pallet) placement',
    operationId: 'confirmarTarefaArmazenagem',
  })
  @ApiSuccessResponse(TarefaArmazenagemResponseDto)
  handle(
    @Param() params: ConfirmarTarefaParamsDto,
    @Body() body: ConfirmarTarefaBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.confirmarTarefaArmazenagemUseCase.execute({
      demandaId: params.id,
      tarefaId: params.tarefaId,
      data: body,
      operatorId: req.user.id,
    });
  }
}
