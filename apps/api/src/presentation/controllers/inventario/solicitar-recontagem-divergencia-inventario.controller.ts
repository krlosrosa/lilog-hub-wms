import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DivergenciaInventarioResponseDto,
  toDivergenciaInventarioPersistidaResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { SolicitarRecontagemDivergenciaUseCase } from '../../../application/usecases/inventario/divergencia.usecases.js';
import { DemandaContagemPrioridadeSchema } from '../../../domain/model/inventario/inventario.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { INVENTARIO_PERMISSION } from '../../../shared/constants/inventario-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const SolicitarRecontagemBodySchema = z.object({
  responsavelId: z.number().int().positive(),
  prioridade: DemandaContagemPrioridadeSchema.default('alta'),
  motivo: z.string().optional(),
});

class SolicitarRecontagemBodyDto extends createZodDto(
  SolicitarRecontagemBodySchema,
) {}

const SolicitarRecontagemParamSchema = z.object({
  id: z.uuid(),
  divId: z.uuid(),
});

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SolicitarRecontagemDivergenciaInventarioController {
  constructor(
    private readonly solicitarRecontagemDivergenciaUseCase: SolicitarRecontagemDivergenciaUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'inventario_divergencia_recontagem' })
  @RequirePermissions(INVENTARIO_PERMISSION.DIVERGENCIA_SOLICITAR_RECONTAGEM)
  @Post(':id/divergencias/:divId/recontagens')
  @ApiOperation({
    summary: 'Solicitar recontagem de divergencia de inventario',
    operationId: 'solicitarRecontagemDivergenciaInventario',
  })
  @ApiSuccessResponse(DivergenciaInventarioResponseDto, 'created')
  async handle(
    @Param() params: { id: string; divId: string },
    @Body() body: SolicitarRecontagemBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const { id, divId } = SolicitarRecontagemParamSchema.parse(params);
    const updated = await this.solicitarRecontagemDivergenciaUseCase.execute({
      inventarioId: id,
      divergenciaId: divId,
      responsavelId: body.responsavelId,
      prioridade: body.prioridade,
      motivo: body.motivo,
      solicitadaPor: getRequestUser(request)?.id ?? null,
    });

    return toDivergenciaInventarioPersistidaResponse(updated);
  }
}
