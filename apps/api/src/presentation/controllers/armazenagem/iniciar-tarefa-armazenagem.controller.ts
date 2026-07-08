import { Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TarefaArmazenagemResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { IniciarTarefaArmazenagemUseCase } from '../../../application/usecases/armazenagem/iniciar-tarefa-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const IniciarTarefaParamsSchema = z.object({
  id: z.uuid(),
  tarefaId: z.uuid(),
});

class IniciarTarefaParamsDto extends createZodDto(IniciarTarefaParamsSchema) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class IniciarTarefaArmazenagemController {
  constructor(
    private readonly iniciarTarefaArmazenagemUseCase: IniciarTarefaArmazenagemUseCase,
  ) {}

  @Post(':id/tarefas/:tarefaId/iniciar')
  @ApiOperation({
    summary: 'Start storage task (pallet)',
    operationId: 'iniciarTarefaArmazenagem',
  })
  @ApiSuccessResponse(TarefaArmazenagemResponseDto)
  handle(
    @Param() params: IniciarTarefaParamsDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.iniciarTarefaArmazenagemUseCase.execute({
      demandaId: params.id,
      tarefaId: params.tarefaId,
      operatorId: req.user.id,
    });
  }
}
