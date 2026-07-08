import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RegraProcessoResponseDto } from '../../../application/dtos/regra-processo/regra-processo.dto.js';
import { UpdateRegraProcessoUseCase } from '../../../application/usecases/regra-processo/update-regra-processo.usecase.js';
import {
  AcaoRegraSchema,
  ArvoreCondicoesSchema,
  GatilhoRegraSchema,
  ModoAvaliacaoRegraSchema,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const UpdateRegraProcessoBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().optional(),
  gatilho: GatilhoRegraSchema.optional(),
  prioridade: z.number().int().min(1).max(100).optional(),
  modoAvaliacao: ModoAvaliacaoRegraSchema.optional(),
  arvoreCondicoes: ArvoreCondicoesSchema.optional(),
  acoes: z.array(AcaoRegraSchema).min(1).optional(),
  ativo: z.boolean().optional(),
});

class UpdateRegraProcessoBodyDto extends createZodDto(
  UpdateRegraProcessoBodySchema,
) {}

@ApiTags('Regras de Processo')
@Controller('regras-processo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateRegraProcessoController {
  constructor(
    private readonly updateRegraProcessoUseCase: UpdateRegraProcessoUseCase,
  ) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Update process rule',
    operationId: 'updateRegraProcesso',
  })
  @ApiSuccessResponse(RegraProcessoResponseDto, 'ok')
  handle(@Param('id') id: string, @Body() body: UpdateRegraProcessoBodyDto) {
    return this.updateRegraProcessoUseCase.execute({ id, data: body });
  }
}
