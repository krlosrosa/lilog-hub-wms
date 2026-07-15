import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GetRecebimentoPainelSnapshotQueryDto,
  RecebimentoPainelSnapshotResponseDto,
} from '../../../application/dtos/recebimento/recebimento-painel-snapshot.dto.js';
import { GetRecebimentoPainelSnapshotUseCase } from '../../../application/usecases/recebimento/get-recebimento-painel-snapshot.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecebimentoPainelSnapshotController {
  constructor(
    private readonly getRecebimentoPainelSnapshotUseCase: GetRecebimentoPainelSnapshotUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Get('painel/snapshot')
  @ApiOperation({
    summary: 'Obter snapshot do painel de recebimento',
    operationId: 'getRecebimentoPainelSnapshot',
  })
  @ApiSuccessResponse(RecebimentoPainelSnapshotResponseDto)
  handle(@Query() query: GetRecebimentoPainelSnapshotQueryDto) {
    return this.getRecebimentoPainelSnapshotUseCase.execute({
      unidadeId: query.unidadeId,
      dataInicio: new Date(query.dataInicio),
      dataFim: new Date(query.dataFim),
      dataReferencia: query.dataReferencia,
    });
  }
}
