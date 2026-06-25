import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteTransportadoraUseCase } from '../../../application/usecases/transportadora/delete-transportadora.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
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
export class DeleteTransportadoraController {
  constructor(
    private readonly deleteTransportadoraUseCase: DeleteTransportadoraUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.DELETE)
  @Auditable({ action: 'delete', resource: 'transportadora' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete transportadora',
    operationId: 'deleteTransportadora',
  })
  handle(@Param('id') id: string) {
    return this.deleteTransportadoraUseCase.execute(id);
  }
}
