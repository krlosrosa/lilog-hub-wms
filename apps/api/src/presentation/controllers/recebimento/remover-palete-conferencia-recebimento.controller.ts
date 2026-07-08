import {
  Controller,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverPaleteConferenciaRecebimentoUseCase } from '../../../application/usecases/recebimento/remover-palete-conferencia-recebimento.usecase.js';
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

const RemoverPaleteConferenciaQuerySchema = z.object({
  produtoId: z.string().min(1).max(50).optional(),
});

class RemoverPaleteConferenciaQueryDto extends createZodDto(
  RemoverPaleteConferenciaQuerySchema,
) {}

const RemoverPaleteConferenciaResponseSchema = z.object({
  unitizadorCodigo: z.string(),
  unitizadorId: z.uuid(),
  removedCount: z.number().int().nonnegative(),
});

class RemoverPaleteConferenciaResponseDto extends createZodDto(
  RemoverPaleteConferenciaResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverPaleteConferenciaRecebimentoController {
  constructor(
    private readonly removerPaleteConferenciaRecebimentoUseCase: RemoverPaleteConferenciaRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'remover_palete_conferencia', resource: 'recebimento' })
  @Delete(':id/paletes/:unitizadorCodigo')
  @ApiOperation({
    summary: 'Remover conferência de um palete',
    operationId: 'removerPaleteConferenciaRecebimento',
  })
  @ApiQuery({ name: 'produtoId', required: false, type: String })
  @ApiSuccessResponse(RemoverPaleteConferenciaResponseDto)
  handle(
    @Param('id') id: string,
    @Param('unitizadorCodigo') unitizadorCodigo: string,
    @Query() query: RemoverPaleteConferenciaQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.removerPaleteConferenciaRecebimentoUseCase.execute({
      recebimentoId: id,
      unitizadorCodigo,
      produtoId: query.produtoId,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
