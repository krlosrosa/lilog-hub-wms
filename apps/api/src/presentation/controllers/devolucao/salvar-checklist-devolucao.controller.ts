import { Body, Controller, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SalvarChecklistDevolucaoUseCase } from '../../../application/usecases/devolucao/salvar-checklist-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const SalvarChecklistDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class SalvarChecklistDevolucaoQueryDto extends createZodDto(
  SalvarChecklistDevolucaoQuerySchema,
) {}

const SalvarChecklistDevolucaoBodySchema = z.object({
  dock: z.string().min(1).max(100),
  paletesRecebidos: z.coerce.number().int().min(0),
  tempBau: z.number().optional(),
  tempProduto: z.number().optional(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().max(2000).optional(),
  photoCount: z.coerce.number().int().min(0).optional(),
});

class SalvarChecklistDevolucaoBodyDto extends createZodDto(
  SalvarChecklistDevolucaoBodySchema,
) {}

const SalvarChecklistDevolucaoResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
});

class SalvarChecklistDevolucaoResponseDto extends createZodDto(
  SalvarChecklistDevolucaoResponseSchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SalvarChecklistDevolucaoController {
  constructor(
    private readonly salvarChecklistDevolucaoUseCase: SalvarChecklistDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'devolucao_checklist' })
  @Post(':id/checklist')
  @ApiOperation({
    summary: 'Registrar checklist de entrada da devolução',
    operationId: 'salvarChecklistDevolucao',
  })
  @ApiSuccessResponse(SalvarChecklistDevolucaoResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Query() query: SalvarChecklistDevolucaoQueryDto,
    @Body() body: SalvarChecklistDevolucaoBodyDto,
  ) {
    return this.salvarChecklistDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
      dock: body.dock,
      paletesRecebidos: body.paletesRecebidos,
      tempBau: body.tempBau,
      tempProduto: body.tempProduto,
      conditions: body.conditions,
      observacoes: body.observacoes,
      photoCount: body.photoCount,
    });
  }
}
