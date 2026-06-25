import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaContagemResponseDto,
  toDemandaContagemResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { CreateDemandaContagemUseCase } from '../../../application/usecases/inventario/demanda.usecases.js';
import {
  DemandaContagemPrioridadeSchema,
  DemandaContagemTipoSchema,
  DemandaFiltrosSchema,
} from '../../../domain/model/inventario/inventario.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateDemandaBodySchema = z.object({
  nome: z.string().min(1),
  tipo: DemandaContagemTipoSchema,
  prioridade: DemandaContagemPrioridadeSchema.default('media'),
  ativo: z.boolean().default(true),
  responsavelId: z.number().int().positive(),
  filtros: DemandaFiltrosSchema,
  observacoes: z.string().default(''),
  alertaFragilidade: z.boolean().default(false),
});

class CreateDemandaBodyDto extends createZodDto(CreateDemandaBodySchema) {}

@ApiTags('Inventario')
@Controller('inventarios/:inventarioId/demandas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateDemandaController {
  constructor(
    private readonly createDemandaContagemUseCase: CreateDemandaContagemUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'demanda_contagem' })
  @Post()
  @ApiOperation({
    summary: 'Create demanda de contagem',
    operationId: 'createDemandaContagem',
  })
  @ApiSuccessResponse(DemandaContagemResponseDto, 'created')
  async handle(
    @Param('inventarioId') inventarioId: string,
    @Body() body: CreateDemandaBodyDto,
  ) {
    const created = await this.createDemandaContagemUseCase.execute({
      inventarioId,
      ...body,
    });
    return toDemandaContagemResponse(created);
  }
}
