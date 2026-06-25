import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DocaActionBodyDto,
  DocaResponseDto,
} from '../../../application/dtos/doca/doca.dto.js';
import { BlockDocaUseCase } from '../../../application/usecases/doca/block-doca.usecase.js';
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
export class BlockDocaController {
  constructor(private readonly blockDocaUseCase: BlockDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_BLOCK)
  @Auditable({ action: 'block', resource: 'doca' })
  @Patch(':id/bloquear')
  @ApiOperation({
    summary: 'Block doca',
    operationId: 'blockDoca',
  })
  @ApiSuccessResponse(DocaResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: DocaActionBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.blockDocaUseCase.execute({
      id,
      motivo: body.motivo,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
