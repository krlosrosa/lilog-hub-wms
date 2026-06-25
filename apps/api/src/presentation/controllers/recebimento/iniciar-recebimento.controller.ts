import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { IniciarRecebimentoUseCase } from '../../../application/usecases/recebimento/iniciar-recebimento.usecase.js';
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

const IniciarRecebimentoBodySchema = z.object({
  preRecebimentoId: z.uuid(),
  docaId: z.uuid().optional(),
  responsavelId: z.number().int().positive(),
});

class IniciarRecebimentoBodyDto extends createZodDto(
  IniciarRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class IniciarRecebimentoController {
  constructor(
    private readonly iniciarRecebimentoUseCase: IniciarRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'start', resource: 'recebimento' })
  @Post()
  @ApiOperation({
    summary: 'Start recebimento',
    operationId: 'iniciarRecebimento',
  })
  @ApiSuccessResponse(RecebimentoResponseDto, 'created')
  handle(
    @Body() body: IniciarRecebimentoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.iniciarRecebimentoUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
