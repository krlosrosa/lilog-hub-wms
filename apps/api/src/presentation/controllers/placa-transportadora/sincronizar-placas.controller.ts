import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SincronizarPlacasResponseDto } from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { SincronizarPlacasUseCase } from '../../../application/usecases/placa-transportadora/sincronizar-placas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SincronizarPlacasController {
  constructor(
    private readonly sincronizarPlacasUseCase: SincronizarPlacasUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.UPDATE)
  @Auditable({ action: 'sync', resource: 'placa-transportadora' })
  @Post(':transportadoraId/placas/sincronizar')
  @ApiOperation({
    summary: 'Sync placas from Ravex for transportadora',
    operationId: 'sincronizarPlacasTransportadora',
  })
  @ApiSuccessResponse(SincronizarPlacasResponseDto, 'ok')
  handle(@Param('transportadoraId') transportadoraId: string) {
    return this.sincronizarPlacasUseCase.execute(transportadoraId);
  }
}
