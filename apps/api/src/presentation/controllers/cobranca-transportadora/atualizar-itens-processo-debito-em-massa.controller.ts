import { Body, Controller, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AtualizarItensProcessoDebitoEmMassaBodyDto,
  AtualizarItensProcessoDebitoEmMassaQueryDto,
  AtualizarItensProcessoDebitoEmMassaResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { AtualizarItensProcessoDebitoEmMassaUseCase } from '../../../application/usecases/cobranca-transportadora/atualizar-itens-processo-debito-em-massa.usecase.js';
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
export class AtualizarItensProcessoDebitoEmMassaController {
  constructor(
    private readonly atualizarItensProcessoDebitoEmMassaUseCase: AtualizarItensProcessoDebitoEmMassaUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'processo_debito_item' })
  @Patch(':id/itens/em-massa')
  @ApiOperation({
    summary: 'Atualizar itens de processo de débito em massa',
    operationId: 'atualizarItensProcessoDebitoEmMassa',
  })
  @ApiSuccessResponse(AtualizarItensProcessoDebitoEmMassaResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: AtualizarItensProcessoDebitoEmMassaQueryDto,
    @Body() body: AtualizarItensProcessoDebitoEmMassaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.atualizarItensProcessoDebitoEmMassaUseCase.execute({
      processoId: id,
      unidadeId: query.unidadeId,
      itens: body.itens,
      criadoPorUserId: getRequestUser(request)?.id ?? null,
    });
  }
}
