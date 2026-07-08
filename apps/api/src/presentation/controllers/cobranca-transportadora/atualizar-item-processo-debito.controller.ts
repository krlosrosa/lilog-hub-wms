import { Body, Controller, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarItemProcessoDebitoQueryDto,
  AtualizarItemProcessoDebitoResponseDto,
  DebitoItemStatusSchema,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { AtualizarItemProcessoDebitoUseCase } from '../../../application/usecases/cobranca-transportadora/atualizar-item-processo-debito.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import { getRequestUser, type RequestUser } from '../../../shared/utils/request-user.js';

const AtualizarItemProcessoDebitoBodySchema = z.object({
  valorUnitario: z.coerce.number().nonnegative().nullable().optional(),
  valorDebito: z.coerce.number().nonnegative().optional(),
  quantidade: z.coerce.number().positive().optional(),
  status: DebitoItemStatusSchema.optional(),
  observacao: z.string().max(2000).nullable().optional(),
});

class AtualizarItemProcessoDebitoBodyDto extends createZodDto(
  AtualizarItemProcessoDebitoBodySchema,
) {}

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarItemProcessoDebitoController {
  constructor(
    private readonly atualizarItemProcessoDebitoUseCase: AtualizarItemProcessoDebitoUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'processo_debito_item' })
  @Patch(':id/itens/:itemId')
  @ApiOperation({
    summary: 'Atualizar item de processo de débito',
    operationId: 'atualizarItemProcessoDebito',
  })
  @ApiSuccessResponse(AtualizarItemProcessoDebitoResponseDto)
  handle(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Query() query: AtualizarItemProcessoDebitoQueryDto,
    @Body() body: AtualizarItemProcessoDebitoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.atualizarItemProcessoDebitoUseCase.execute({
      processoId: id,
      itemId,
      unidadeId: query.unidadeId,
      valorUnitario: body.valorUnitario,
      valorDebito: body.valorDebito,
      quantidade: body.quantidade,
      status: body.status,
      observacao: body.observacao,
      criadoPorUserId: getRequestUser(request)?.id ?? null,
    });
  }
}
