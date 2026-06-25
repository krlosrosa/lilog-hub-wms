import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarPerfilPlacasMassaResponseDto,
  PlacaTransportadoraResponseDto,
} from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { AtualizarPerfilPlacaUseCase } from '../../../application/usecases/placa-transportadora/atualizar-perfil-placa.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarPerfilPlacaBodySchema = z.object({
  perfilTarifaId: z.uuid().nullable(),
});

class AtualizarPerfilPlacaBodyDto extends createZodDto(
  AtualizarPerfilPlacaBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarPerfilPlacaController {
  constructor(
    private readonly atualizarPerfilPlacaUseCase: AtualizarPerfilPlacaUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'placa-transportadora' })
  @Patch('placas/:placaId/perfil')
  @ApiOperation({
    summary: 'Update perfil tarifa for a placa',
    operationId: 'atualizarPerfilPlaca',
  })
  @ApiSuccessResponse(PlacaTransportadoraResponseDto)
  handle(
    @Param('placaId') placaId: string,
    @Body() body: AtualizarPerfilPlacaBodyDto,
  ) {
    return this.atualizarPerfilPlacaUseCase.execute({
      placaId,
      perfilTarifaId: body.perfilTarifaId,
    });
  }
}
