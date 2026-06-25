import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SubmitContagemAvariaUseCase } from '../../../application/usecases/inventario/contagem.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { CONTAGEM_DEV_OPERATOR_ID } from './contagem-dev.constants.js';

const SubmitContagemAvariaBodySchema = z
  .object({
    motivo: z.string().min(1),
    quantidadeCaixas: z.coerce.number().int().min(0),
    quantidadeUnidades: z.coerce.number().int().min(0),
    photoCount: z.coerce.number().int().min(0).default(0),
    contagemId: z.uuid().optional(),
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas e/ou unidades avariadas',
    path: ['quantidadeUnidades'],
  });

class SubmitContagemAvariaBodyDto extends createZodDto(
  SubmitContagemAvariaBodySchema,
) {}

@ApiTags('Contagem')
@Controller('estoque/contagem')
@ApiErrorResponses()
export class SubmitContagemAvariaController {
  constructor(
    private readonly submitContagemAvariaUseCase: SubmitContagemAvariaUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'contagem_avaria' })
  @Post('demands/:demandaId/enderecos/:itemId/avaria')
  @ApiOperation({
    summary: 'Submit contagem avaria',
    operationId: 'submitContagemAvaria',
  })
  @ApiSuccessResponse(Object, 'created')
  async handle(
    @Param('demandaId') demandaId: string,
    @Param('itemId') itemId: string,
    @Body() body: SubmitContagemAvariaBodyDto,
  ) {
    const result = await this.submitContagemAvariaUseCase.execute({
      demandaId,
      demandaEnderecoId: itemId,
      operatorId: CONTAGEM_DEV_OPERATOR_ID,
      ...body,
    });

    return {
      id: result.id,
      demandaEnderecoId: result.demandaEnderecoId,
      createdAt: result.createdAt.toISOString(),
    };
  }
}
