import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { LiberarConferenciaUseCase } from '../../../application/usecases/recebimento/liberar-conferencia.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const LiberarConferenciaBodySchema = z.object({
  docaId: z.uuid(),
});

class LiberarConferenciaBodyDto extends createZodDto(
  LiberarConferenciaBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class LiberarConferenciaController {
  constructor(
    private readonly liberarConferenciaUseCase: LiberarConferenciaUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'liberar-conferencia', resource: 'pre-recebimento' })
  @Put(':id/liberar-conferencia')
  @ApiOperation({
    summary: 'Release pre-recebimento for conference',
    operationId: 'liberarConferencia',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: LiberarConferenciaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.liberarConferenciaUseCase.execute({
      id,
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
