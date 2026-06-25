import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PerfilTarifaResponseDto } from '../../../application/dtos/perfil-tarifa/perfil-tarifa.dto.js';
import { CreatePerfilTarifaUseCase } from '../../../application/usecases/perfil-tarifa/create-perfil-tarifa.usecase.js';
import { TipoCargaSchema } from '../../../domain/model/perfil-tarifa/perfil-tarifa.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { PERFIL_TARIFA_PERMISSION } from '../../../shared/constants/perfil-tarifa-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreatePerfilTarifaBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavex: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  descricao: z.string().max(500).nullable().optional(),
  peso: z.coerce.number().positive(),
  cubagem: z.coerce.number().positive().nullable().optional(),
  tipoCarga: TipoCargaSchema,
});

class CreatePerfilTarifaBodyDto extends createZodDto(
  CreatePerfilTarifaBodySchema,
) {}

@ApiTags('Perfil Tarifa')
@Controller('perfis-tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreatePerfilTarifaController {
  constructor(
    private readonly createPerfilTarifaUseCase: CreatePerfilTarifaUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.CREATE)
  @Auditable({ action: 'create', resource: 'perfil_tarifa' })
  @Post()
  @ApiOperation({
    summary: 'Create perfil tarifa',
    operationId: 'createPerfilTarifa',
  })
  @ApiSuccessResponse(PerfilTarifaResponseDto, 'created')
  handle(@Body() body: CreatePerfilTarifaBodyDto) {
    return this.createPerfilTarifaUseCase.execute(body);
  }
}
