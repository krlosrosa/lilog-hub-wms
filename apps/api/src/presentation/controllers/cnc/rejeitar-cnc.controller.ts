import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CncResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { RejeitarCncUseCase } from '../../../application/usecases/cnc/rejeitar-cnc.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const RejeitarCncBodySchema = z.object({
  observacaoAprovador: z.string().min(1),
});

class RejeitarCncBodyDto extends createZodDto(RejeitarCncBodySchema) {}

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RejeitarCncController {
  constructor(private readonly rejeitarCncUseCase: RejeitarCncUseCase) {}

  @RequirePermissions(CNC_PERMISSION.REJEITAR)
  @Auditable({ action: 'reject', resource: 'cnc' })
  @Put(':id/rejeitar')
  @ApiOperation({
    summary: 'Rejeitar CNC',
    operationId: 'rejeitarCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: RejeitarCncBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.rejeitarCncUseCase.execute({
      cncId: id,
      aprovadorId: user?.id ?? 0,
      observacaoAprovador: body.observacaoAprovador,
    });
  }
}
