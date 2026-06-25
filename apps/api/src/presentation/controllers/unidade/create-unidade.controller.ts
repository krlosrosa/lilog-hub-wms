import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UnidadeResponseDto } from '../../../application/dtos/unidade/list-unidades.dto.js';
import { CreateUnidadeUseCase } from '../../../application/usecases/unidade/create-unidade.usecase.js';
import {
  ClusterSchema,
  EmpresaSchema,
} from '../../../domain/model/unidade/unidade.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
const CreateCentroBodySchema = z.object({
  centro: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Centro deve conter exatamente 4 dígitos'),
  empresa: EmpresaSchema,
  nome: z.string().min(1),
});

const CreateUnidadeBodySchema = z.object({
  id: z.string().min(1).max(50),
  nome: z.string().min(1),
  cluster: ClusterSchema,
  nomeFilial: z.string().min(1),
  centros: z.array(CreateCentroBodySchema).default([]),
});

class CreateUnidadeBodyDto extends createZodDto(CreateUnidadeBodySchema) {}

@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateUnidadeController {
  constructor(private readonly createUnidadeUseCase: CreateUnidadeUseCase) {}

  @Auditable({ action: 'create', resource: 'unidade' })
  @Post()
  @ApiOperation({
    summary: 'Create unidade',
    operationId: 'createUnidade',
  })
  @ApiSuccessResponse(UnidadeResponseDto, 'created')
  handle(@Body() body: CreateUnidadeBodyDto) {
    return this.createUnidadeUseCase.execute(body);
  }
}
