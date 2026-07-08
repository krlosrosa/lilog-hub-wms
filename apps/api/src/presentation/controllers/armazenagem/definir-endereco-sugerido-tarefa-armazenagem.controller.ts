import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TarefaArmazenagemResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { DefinirEnderecoSugeridoTarefaArmazenagemUseCase } from '../../../application/usecases/armazenagem/definir-endereco-sugerido-tarefa-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const DefinirEnderecoTarefaParamsSchema = z.object({
  id: z.uuid(),
  tarefaId: z.uuid(),
});

class DefinirEnderecoTarefaParamsDto extends createZodDto(
  DefinirEnderecoTarefaParamsSchema,
) {}

const DefinirEnderecoTarefaBodySchema = z.object({
  enderecoSugeridoId: z.uuid(),
});

class DefinirEnderecoTarefaBodyDto extends createZodDto(
  DefinirEnderecoTarefaBodySchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DefinirEnderecoSugeridoTarefaArmazenagemController {
  constructor(
    private readonly definirEnderecoSugeridoTarefaArmazenagemUseCase: DefinirEnderecoSugeridoTarefaArmazenagemUseCase,
  ) {}

  @Patch(':id/tarefas/:tarefaId/endereco-sugerido')
  @ApiOperation({
    summary: 'Set suggested address for storage task (pallet)',
    operationId: 'definirEnderecoSugeridoTarefaArmazenagem',
  })
  @ApiSuccessResponse(TarefaArmazenagemResponseDto)
  handle(
    @Param() params: DefinirEnderecoTarefaParamsDto,
    @Body() body: DefinirEnderecoTarefaBodyDto,
  ) {
    return this.definirEnderecoSugeridoTarefaArmazenagemUseCase.execute({
      demandaId: params.id,
      tarefaId: params.tarefaId,
      enderecoSugeridoId: body.enderecoSugeridoId,
    });
  }
}
