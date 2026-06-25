import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SubmitContagemValidacaoUseCase } from '../../../application/usecases/inventario/contagem.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { CONTAGEM_DEV_OPERATOR_ID } from './contagem-dev.constants.js';

const SubmitContagemValidacaoBodySchema = z.object({
  enderecoConfirmado: z.string().optional(),
  sscc: z.string().optional(),
  enderecoVazio: z.boolean().default(false),
  anomaliaEncontrada: z.boolean().default(false),
  quantidadeCaixas: z.coerce.number().int().min(0),
  quantidadeUnidades: z.coerce.number().int().min(0),
  lote: z.string().optional(),
  peso: z.coerce.number().min(0).optional(),
  codigoProduto: z.string().default(''),
});

class SubmitContagemValidacaoBodyDto extends createZodDto(
  SubmitContagemValidacaoBodySchema,
) {}

@ApiTags('Contagem')
@Controller('estoque/contagem')
@ApiErrorResponses()
export class SubmitContagemValidacaoController {
  constructor(
    private readonly submitContagemValidacaoUseCase: SubmitContagemValidacaoUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'contagem' })
  @Post('demands/:demandaId/enderecos/:itemId/validacao')
  @ApiOperation({
    summary: 'Submit contagem validacao',
    operationId: 'submitContagemValidacao',
  })
  @ApiSuccessResponse(Object, 'created')
  async handle(
    @Param('demandaId') demandaId: string,
    @Param('itemId') itemId: string,
    @Body() body: SubmitContagemValidacaoBodyDto,
  ) {
    const result = await this.submitContagemValidacaoUseCase.execute({
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
