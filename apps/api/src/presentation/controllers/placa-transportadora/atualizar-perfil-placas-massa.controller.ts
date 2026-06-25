import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AtualizarPerfilPlacasMassaResponseDto } from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { AtualizarPerfilPlacasMassaUseCase } from '../../../application/usecases/placa-transportadora/atualizar-perfil-placas-massa.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarPerfilPlacasMassaBodySchema = z.object({
  placaIds: z.array(z.uuid()).min(1),
  perfilTarifaId: z.uuid().nullable(),
});

class AtualizarPerfilPlacasMassaBodyDto extends createZodDto(
  AtualizarPerfilPlacasMassaBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarPerfilPlacasMassaController {
  constructor(
    private readonly atualizarPerfilPlacasMassaUseCase: AtualizarPerfilPlacasMassaUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'placa-transportadora' })
  @Patch('placas/perfil/massa')
  @ApiOperation({
    summary: 'Bulk update perfil tarifa for placas',
    operationId: 'atualizarPerfilPlacasMassa',
  })
  @ApiSuccessResponse(AtualizarPerfilPlacasMassaResponseDto)
  handle(@Body() body: AtualizarPerfilPlacasMassaBodyDto) {
    return this.atualizarPerfilPlacasMassaUseCase.execute({
      placaIds: body.placaIds,
      perfilTarifaId: body.perfilTarifaId,
    });
  }
}
