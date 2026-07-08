import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RegraEnderecamentoResponseDto } from '../../../application/dtos/armazenagem/regra-enderecamento.dto.js';
import { UpdateRegraEnderecamentoUseCase } from '../../../application/usecases/armazenagem/update-regra-enderecamento.usecase.js';
import {
  RegraEnderecamentoCriterioTipoSchema,
  RegraEnderecamentoDestinoInputSchema,
} from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const UpdateRegraEnderecamentoBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema.optional(),
  criterioValor: z.string().min(1).max(100).optional(),
  prioridade: z.number().int().min(1).optional(),
  ativo: z.boolean().optional(),
  destinos: z.array(RegraEnderecamentoDestinoInputSchema).min(1).optional(),
});

class UpdateRegraEnderecamentoBodyDto extends createZodDto(
  UpdateRegraEnderecamentoBodySchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/regras-enderecamento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateRegraEnderecamentoController {
  constructor(
    private readonly updateRegraEnderecamentoUseCase: UpdateRegraEnderecamentoUseCase,
  ) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Update storage addressing rule',
    operationId: 'updateRegraEnderecamento',
  })
  @ApiSuccessResponse(RegraEnderecamentoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateRegraEnderecamentoBodyDto,
  ) {
    return this.updateRegraEnderecamentoUseCase.execute({ id, data: body });
  }
}
