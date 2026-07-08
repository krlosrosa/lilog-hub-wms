import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverLinhaConferenciaRecebimentoUseCase } from '../../../application/usecases/recebimento/remover-linha-conferencia-recebimento.usecase.js';
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

const RemoverLinhaConferenciaResponseSchema = z.object({
  itemId: z.uuid(),
  removed: z.literal(true),
  produtoId: z.string().optional(),
});

class RemoverLinhaConferenciaResponseDto extends createZodDto(
  RemoverLinhaConferenciaResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverLinhaConferenciaRecebimentoController {
  constructor(
    private readonly removerLinhaConferenciaRecebimentoUseCase: RemoverLinhaConferenciaRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'remover_linha_conferencia', resource: 'recebimento' })
  @Delete(':id/itens-linha/:itemId')
  @ApiOperation({
    summary: 'Remover uma linha de conferência',
    operationId: 'removerLinhaConferenciaRecebimento',
  })
  @ApiSuccessResponse(RemoverLinhaConferenciaResponseDto)
  handle(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.removerLinhaConferenciaRecebimentoUseCase.execute({
      recebimentoId: id,
      itemId,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
