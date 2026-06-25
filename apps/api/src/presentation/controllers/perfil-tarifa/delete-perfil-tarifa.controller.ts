import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeletePerfilTarifaUseCase } from '../../../application/usecases/perfil-tarifa/delete-perfil-tarifa.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { PERFIL_TARIFA_PERMISSION } from '../../../shared/constants/perfil-tarifa-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Perfil Tarifa')
@Controller('perfis-tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeletePerfilTarifaController {
  constructor(
    private readonly deletePerfilTarifaUseCase: DeletePerfilTarifaUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.DELETE)
  @Auditable({ action: 'delete', resource: 'perfil_tarifa' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete perfil tarifa',
    operationId: 'deletePerfilTarifa',
  })
  handle(@Param('id') id: string) {
    return this.deletePerfilTarifaUseCase.execute(id);
  }
}
