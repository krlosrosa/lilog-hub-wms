import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RegraEnderecamentoResponseDto } from '../../../application/dtos/armazenagem/regra-enderecamento.dto.js';
import { CreateRegraEnderecamentoUseCase } from '../../../application/usecases/armazenagem/create-regra-enderecamento.usecase.js';
import {
  RegraEnderecamentoCriterioTipoSchema,
  RegraEnderecamentoDestinoInputSchema,
} from '../../../domain/model/armazenagem/regra-enderecamento.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateRegraEnderecamentoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema,
  criterioValor: z.string().min(1).max(100),
  prioridade: z.number().int().min(1).default(10),
  ativo: z.boolean().default(true),
  destinos: z.array(RegraEnderecamentoDestinoInputSchema).min(1),
});

class CreateRegraEnderecamentoBodyDto extends createZodDto(
  CreateRegraEnderecamentoBodySchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/regras-enderecamento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateRegraEnderecamentoController {
  constructor(
    private readonly createRegraEnderecamentoUseCase: CreateRegraEnderecamentoUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create storage addressing rule',
    operationId: 'createRegraEnderecamento',
  })
  @ApiSuccessResponse(RegraEnderecamentoResponseDto, 'created')
  handle(@Body() body: CreateRegraEnderecamentoBodyDto) {
    return this.createRegraEnderecamentoUseCase.execute({ data: body });
  }
}
