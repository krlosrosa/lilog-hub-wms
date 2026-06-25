import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteDocaUseCase } from '../../../application/usecases/doca/delete-doca.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteDocaController {
  constructor(private readonly deleteDocaUseCase: DeleteDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_UPDATE)
  @Auditable({ action: 'delete', resource: 'doca' })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete doca',
    operationId: 'deleteDoca',
  })
  async handle(@Param('id') id: string) {
    await this.deleteDocaUseCase.execute(id);
  }
}
