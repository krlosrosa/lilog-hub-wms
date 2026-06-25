import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SubmitContagemCegaUseCase } from '../../../application/usecases/inventario/contagem.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { CONTAGEM_DEV_OPERATOR_ID } from './contagem-dev.constants.js';

const SubmitContagemCegaBodySchema = z
  .object({
    enderecoArmazenagem: z.string().min(1),
    codigoProduto: z.string().min(1),
    quantidadeCaixas: z.coerce.number().int().min(0),
    quantidadeUnidades: z.coerce.number().int().min(0),
    lote: z.string().min(1),
    peso: z.coerce.number().positive(),
  })
  .refine((data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0, {
    message: 'Informe caixas ou unidades',
    path: ['quantidadeUnidades'],
  });

class SubmitContagemCegaBodyDto extends createZodDto(
  SubmitContagemCegaBodySchema,
) {}

@ApiTags('Contagem')
@Controller('estoque/contagem')
@ApiErrorResponses()
export class SubmitContagemCegaController {
  constructor(
    private readonly submitContagemCegaUseCase: SubmitContagemCegaUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'contagem' })
  @Post('demands/:demandaId/enderecos/:itemId/cega')
  @ApiOperation({
    summary: 'Submit contagem cega',
    operationId: 'submitContagemCega',
  })
  @ApiSuccessResponse(Object, 'created')
  async handle(
    @Param('demandaId') demandaId: string,
    @Param('itemId') itemId: string,
    @Body() body: SubmitContagemCegaBodyDto,
  ) {
    const result = await this.submitContagemCegaUseCase.execute({
      demandaId,
      demandaEnderecoId: itemId,
      operatorId: CONTAGEM_DEV_OPERATOR_ID,
      ...body,
    });

    return {
      id: result.id,
      demandaEnderecoId: result.demandaEnderecoId,
      tipo: result.tipo,
      createdAt: result.createdAt.toISOString(),
    };
  }
}
