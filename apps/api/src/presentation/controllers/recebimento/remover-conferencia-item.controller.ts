import { Controller, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverConferenciaItemUseCase } from '../../../application/usecases/recebimento/remover-conferencia-item.usecase.js';
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

const RemoverConferenciaItemResponseSchema = z.object({
  produtoId: z.string(),
  removedCount: z.number().int().nonnegative(),
});

class RemoverConferenciaItemResponseDto extends createZodDto(
  RemoverConferenciaItemResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverConferenciaItemController {
  constructor(
    private readonly removerConferenciaItemUseCase: RemoverConferenciaItemUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'remover_conferencia', resource: 'recebimento' })
  @Delete(':id/itens/:produtoId')
  @ApiOperation({
    summary: 'Remover conferência de um produto',
    operationId: 'removerConferenciaItem',
  })
  @ApiSuccessResponse(RemoverConferenciaItemResponseDto)
  handle(
    @Param('id') id: string,
    @Param('produtoId') produtoId: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.removerConferenciaItemUseCase.execute({
      recebimentoId: id,
      produtoId,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
