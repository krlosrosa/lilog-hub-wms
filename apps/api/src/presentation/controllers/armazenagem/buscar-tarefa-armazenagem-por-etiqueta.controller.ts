import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BuscarTarefaArmazenagemPorEtiquetaUseCase } from '../../../application/usecases/armazenagem/buscar-tarefa-armazenagem-por-etiqueta.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const BuscarTarefaPorEtiquetaQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(100),
});

class BuscarTarefaPorEtiquetaQueryDto extends createZodDto(
  BuscarTarefaPorEtiquetaQuerySchema,
) {}

const BuscarTarefaPorEtiquetaResponseSchema = z.object({
  demandaId: z.uuid(),
  tarefaId: z.uuid(),
  unitizadorCodigo: z.string(),
});

class BuscarTarefaPorEtiquetaResponseDto extends createZodDto(
  BuscarTarefaPorEtiquetaResponseSchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/tarefas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BuscarTarefaArmazenagemPorEtiquetaController {
  constructor(
    private readonly buscarTarefaArmazenagemPorEtiquetaUseCase: BuscarTarefaArmazenagemPorEtiquetaUseCase,
  ) {}

  @Get('por-etiqueta')
  @ApiOperation({
    summary: 'Find storage task by pallet label code',
    operationId: 'buscarTarefaArmazenagemPorEtiqueta',
  })
  @ApiSuccessResponse(BuscarTarefaPorEtiquetaResponseDto)
  handle(@Query() query: BuscarTarefaPorEtiquetaQueryDto) {
    return this.buscarTarefaArmazenagemPorEtiquetaUseCase.execute(query);
  }
}
