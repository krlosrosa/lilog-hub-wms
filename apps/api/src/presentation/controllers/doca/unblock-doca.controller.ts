import { Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocaResponseDto } from '../../../application/dtos/doca/doca.dto.js';
import { UnblockDocaUseCase } from '../../../application/usecases/doca/unblock-doca.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UnblockDocaController {
  constructor(private readonly unblockDocaUseCase: UnblockDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_BLOCK)
  @Auditable({ action: 'unblock', resource: 'doca' })
  @Patch(':id/desbloquear')
  @ApiOperation({
    summary: 'Unblock doca',
    operationId: 'unblockDoca',
  })
  @ApiSuccessResponse(DocaResponseDto)
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.unblockDocaUseCase.execute({
      id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
