import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CreateChecklistRecebimentoUseCase } from '../../../application/usecases/recebimento/create-checklist-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateChecklistBodySchema = z.object({
  lacre: z.string().max(100).optional(),
  tempBau: z.number().optional(),
  tempProduto: z.number().optional(),
  conditions: z.record(z.string(), z.boolean()),
  observacoes: z.string().optional(),
  photoCount: z.coerce.number().int().min(0).optional(),
});

class CreateChecklistBodyDto extends createZodDto(CreateChecklistBodySchema) {}

const CreateChecklistResponseSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
});

class CreateChecklistResponseDto extends createZodDto(
  CreateChecklistResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateChecklistRecebimentoController {
  constructor(
    private readonly createChecklistRecebimentoUseCase: CreateChecklistRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'create', resource: 'checklist_recebimento' })
  @Post(':id/checklist')
  @ApiOperation({
    summary: 'Registrar checklist de entrada do veículo',
    operationId: 'createChecklistRecebimento',
  })
  @ApiSuccessResponse(CreateChecklistResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: CreateChecklistBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.createChecklistRecebimentoUseCase.execute({
      recebimentoId: id,
      data: body,
      userId: req.user?.id ?? null,
    });
  }
}
