import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { UpdatePreRecebimentoUseCase } from '../../../application/usecases/recebimento/update-pre-recebimento.usecase.js';
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

const UpdatePreRecebimentoItemBodySchema = z.object({
  produtoId: z.uuid(),
  quantidadeEsperada: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.number().positive().optional(),
  validadeEsperada: z.iso.datetime().optional(),
});

const UpdatePreRecebimentoBodySchema = z.object({
  transportadoraId: z.string().min(1).max(50).optional(),
  placa: z.string().min(1).max(20).optional(),
  horarioPrevisto: z.iso.datetime().optional(),
  observacao: z.string().nullable().optional(),
  itens: z.array(UpdatePreRecebimentoItemBodySchema).min(1).optional(),
});

class UpdatePreRecebimentoBodyDto extends createZodDto(
  UpdatePreRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdatePreRecebimentoController {
  constructor(
    private readonly updatePreRecebimentoUseCase: UpdatePreRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.ALTERAR)
  @Auditable({ action: 'update', resource: 'pre-recebimento' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update pre-recebimento',
    operationId: 'updatePreRecebimento',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdatePreRecebimentoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.updatePreRecebimentoUseCase.execute({
      id,
      data: {
        ...body,
        horarioPrevisto: body.horarioPrevisto
          ? new Date(body.horarioPrevisto)
          : undefined,
        itens: body.itens?.map((item) => ({
          ...item,
          validadeEsperada: item.validadeEsperada
            ? new Date(item.validadeEsperada)
            : undefined,
        })),
      },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
