import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverAvariasRecebimentoUseCase } from '../../../application/usecases/recebimento/remover-avarias-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const RemoverAvariasRecebimentoResponseSchema = z.object({
  removedCount: z.number().int().nonnegative(),
});

class RemoverAvariasRecebimentoResponseDto extends createZodDto(
  RemoverAvariasRecebimentoResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverAvariasRecebimentoController {
  constructor(
    private readonly removerAvariasRecebimentoUseCase: RemoverAvariasRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'delete', resource: 'recebimento_avaria' })
  @Delete(':id/avarias')
  @ApiOperation({
    summary: 'Remover todas as avarias do recebimento',
    operationId: 'removerRecebimentoAvarias',
  })
  @ApiSuccessResponse(RemoverAvariasRecebimentoResponseDto)
  handle(@Param('id') id: string) {
    return this.removerAvariasRecebimentoUseCase.execute({
      recebimentoId: id,
    });
  }
}
