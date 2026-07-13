import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverAvariaRecebimentoUseCase } from '../../../application/usecases/recebimento/remover-avaria-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const RemoverAvariaRecebimentoResponseSchema = z.object({
  removed: z.literal(true),
});

class RemoverAvariaRecebimentoResponseDto extends createZodDto(
  RemoverAvariaRecebimentoResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverAvariaRecebimentoController {
  constructor(
    private readonly removerAvariaRecebimentoUseCase: RemoverAvariaRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'delete', resource: 'recebimento_avaria' })
  @Delete(':id/avarias/:avariaId')
  @ApiOperation({
    summary: 'Remover uma avaria do recebimento',
    operationId: 'removerRecebimentoAvaria',
  })
  @ApiSuccessResponse(RemoverAvariaRecebimentoResponseDto)
  handle(@Param('id') id: string, @Param('avariaId') avariaId: string) {
    return this.removerAvariaRecebimentoUseCase.execute({
      recebimentoId: id,
      avariaId,
    });
  }
}
