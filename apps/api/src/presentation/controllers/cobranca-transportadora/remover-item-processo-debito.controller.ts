import { Controller, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  RemoverItemProcessoDebitoQueryDto,
  RemoverItemProcessoDebitoResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { RemoverItemProcessoDebitoUseCase } from '../../../application/usecases/cobranca-transportadora/remover-item-processo-debito.usecase.js';
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

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverItemProcessoDebitoController {
  constructor(
    private readonly removerItemProcessoDebitoUseCase: RemoverItemProcessoDebitoUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'delete', resource: 'processo_debito_item' })
  @Delete(':id/itens/:itemId')
  @ApiOperation({
    summary: 'Remover item de processo de débito',
    operationId: 'removerItemProcessoDebito',
  })
  @ApiSuccessResponse(RemoverItemProcessoDebitoResponseDto)
  handle(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Query() query: RemoverItemProcessoDebitoQueryDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.removerItemProcessoDebitoUseCase.execute({
      processoId: id,
      itemId,
      unidadeId: query.unidadeId,
      criadoPorUserId: getRequestUser(request)?.id ?? null,
    });
  }
}
