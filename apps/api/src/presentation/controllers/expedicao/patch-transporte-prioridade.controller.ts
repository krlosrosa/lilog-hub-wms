import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AtualizarPrioridadeTransporteUseCase } from '../../../application/usecases/expedicao/atualizar-prioridade-transporte.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const NivelPrioridadeTransporteSchema = z.enum([
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
]);

const PatchTransportePrioridadeBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  isPrioridade: z.boolean(),
  nivelPrioridade: NivelPrioridadeTransporteSchema.optional(),
});

class PatchTransportePrioridadeBodyDto extends createZodDto(
  PatchTransportePrioridadeBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class PatchTransportePrioridadeController {
  constructor(
    private readonly atualizarPrioridadeTransporteUseCase: AtualizarPrioridadeTransporteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'transporte_prioridade' })
  @Patch(':id/prioridade')
  @ApiOperation({
    summary: 'Atualizar prioridade do transporte de expedição',
    operationId: 'patchTransportePrioridade',
  })
  handle(
    @Param('id') id: string,
    @Body() body: PatchTransportePrioridadeBodyDto,
  ) {
    return this.atualizarPrioridadeTransporteUseCase.execute({
      id,
      unidadeId: body.unidadeId,
      isPrioridade: body.isPrioridade,
      nivelPrioridade: body.nivelPrioridade,
    });
  }
}
