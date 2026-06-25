import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PerfilTarifaResponseDto } from '../../../application/dtos/perfil-tarifa/perfil-tarifa.dto.js';
import { UpdatePerfilTarifaUseCase } from '../../../application/usecases/perfil-tarifa/update-perfil-tarifa.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { PERFIL_TARIFA_PERMISSION } from '../../../shared/constants/perfil-tarifa-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

import { TipoCargaSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';

const UpdatePerfilTarifaBodySchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().max(500).nullable().optional(),
  peso: z.coerce.number().positive().optional(),
  cubagem: z.coerce.number().positive().nullable().optional(),
  tipoCarga: TipoCargaSchema.optional(),
});

class UpdatePerfilTarifaBodyDto extends createZodDto(
  UpdatePerfilTarifaBodySchema,
) {}

@ApiTags('Perfil Tarifa')
@Controller('perfis-tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdatePerfilTarifaController {
  constructor(
    private readonly updatePerfilTarifaUseCase: UpdatePerfilTarifaUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'perfil_tarifa' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update perfil tarifa',
    operationId: 'updatePerfilTarifa',
  })
  @ApiSuccessResponse(PerfilTarifaResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdatePerfilTarifaBodyDto,
  ) {
    return this.updatePerfilTarifaUseCase.execute(id, body);
  }
}
