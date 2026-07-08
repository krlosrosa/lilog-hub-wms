import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RegraProcessoResponseDto } from '../../../application/dtos/regra-processo/regra-processo.dto.js';
import { CreateRegraProcessoUseCase } from '../../../application/usecases/regra-processo/create-regra-processo.usecase.js';
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

const CreateRegraProcessoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  descricao: z.string().optional(),
  gatilho: GatilhoRegraSchema,
  prioridade: z.number().int().min(1).max(100).default(10),
  modoAvaliacao: ModoAvaliacaoRegraSchema.default('parar_no_primeiro_match'),
  arvoreCondicoes: ArvoreCondicoesSchema,
  acoes: z.array(AcaoRegraSchema).min(1),
  ativo: z.boolean().default(true),
});

class CreateRegraProcessoBodyDto extends createZodDto(
  CreateRegraProcessoBodySchema,
) {}

@ApiTags('Regras de Processo')
@Controller('regras-processo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateRegraProcessoController {
  constructor(
    private readonly createRegraProcessoUseCase: CreateRegraProcessoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create process rule',
    operationId: 'createRegraProcesso',
  })
  @ApiSuccessResponse(RegraProcessoResponseDto, 'created')
  handle(@Body() body: CreateRegraProcessoBodyDto) {
    return this.createRegraProcessoUseCase.execute({ data: body });
  }
}
