import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ListCentrosUseCase } from '../../../application/usecases/unidade/list-centros.usecase.js';
import { EmpresaSchema } from '../../../domain/model/unidade/unidade.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

export const CentroOptionResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  centro: z.string(),
  empresa: EmpresaSchema,
  nome: z.string(),
  unidadeNome: z.string(),
  unidadeFilial: z.string(),
  createdAt: z.iso.datetime(),
});

export class CentroOptionResponseDto extends createZodDto(
  CentroOptionResponseSchema,
) {}

export const ListCentrosResponseSchema = z.array(CentroOptionResponseSchema);

export class ListCentrosResponseDto extends createZodDto(
  ListCentrosResponseSchema,
) {}

@ApiTags('Unidade')
@Controller('centros')
@ApiErrorResponses()
export class ListCentrosController {
  constructor(private readonly listCentrosUseCase: ListCentrosUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List all centros',
    operationId: 'listCentros',
  })
  @ApiSuccessResponse(ListCentrosResponseDto)
  handle(@Query('unidadeId') unidadeId?: string) {
    return this.listCentrosUseCase.execute(unidadeId);
  }
}
