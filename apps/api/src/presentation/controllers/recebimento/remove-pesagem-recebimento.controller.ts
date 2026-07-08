import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemovePesagemRecebimentoUseCase } from '../../../application/usecases/recebimento/remove-pesagem-recebimento.usecase.js';
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

const RemovePesagemRecebimentoResponseSchema = z.object({
  pesagemId: z.uuid(),
  removed: z.literal(true),
  produtoId: z.string().optional(),
  recebimentoItemId: z.uuid().optional(),
  itemRemoved: z.boolean().optional(),
});

class RemovePesagemRecebimentoResponseDto extends createZodDto(
  RemovePesagemRecebimentoResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemovePesagemRecebimentoController {
  constructor(
    private readonly removePesagemRecebimentoUseCase: RemovePesagemRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'remover_pesagem_recebimento', resource: 'recebimento' })
  @Delete(':id/pesagens/:pesagemId')
  @ApiOperation({
    summary: 'Remover uma pesagem de caixa PVAR',
    operationId: 'removePesagemRecebimento',
  })
  @ApiSuccessResponse(RemovePesagemRecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Param('pesagemId') pesagemId: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.removePesagemRecebimentoUseCase.execute({
      recebimentoId: id,
      pesagemId,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
