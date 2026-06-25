import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PerfilTarifaResponseDto } from '../../../application/dtos/perfil-tarifa/perfil-tarifa.dto.js';
import { UpsertFaixasKmUseCase } from '../../../application/usecases/perfil-tarifa/upsert-faixas-km.usecase.js';
import { FaixaKmInputSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { PERFIL_TARIFA_PERMISSION } from '../../../shared/constants/perfil-tarifa-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpsertFaixasKmBodySchema = z.object({
  faixas: z.array(FaixaKmInputSchema).min(1),
});

class UpsertFaixasKmBodyDto extends createZodDto(UpsertFaixasKmBodySchema) {}

@ApiTags('Perfil Tarifa')
@Controller('perfis-tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpsertFaixasKmController {
  constructor(
    private readonly upsertFaixasKmUseCase: UpsertFaixasKmUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'perfil_tarifa_faixas_km' })
  @Put(':id/faixas-km')
  @ApiOperation({
    summary: 'Upsert faixas km for perfil tarifa',
    operationId: 'upsertFaixasKm',
  })
  @ApiSuccessResponse(PerfilTarifaResponseDto)
  handle(@Param('id') id: string, @Body() body: UpsertFaixasKmBodyDto) {
    return this.upsertFaixasKmUseCase.execute(id, body);
  }
}
