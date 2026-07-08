import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DeletarDemandaDevolucaoQueryDto,
  DeletarDemandaDevolucaoResponseDto,
} from '../../../application/dtos/devolucao/buscar-demanda-devolucao.dto.js';
import { DeletarDemandaDevolucaoUseCase } from '../../../application/usecases/devolucao/deletar-demanda-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeletarDemandaDevolucaoController {
  constructor(
    private readonly deletarDemandaDevolucaoUseCase: DeletarDemandaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'delete', resource: 'demanda_devolucao' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar uma demanda de devolução',
    operationId: 'deletarDemandaDevolucao',
  })
  @ApiSuccessResponse(DeletarDemandaDevolucaoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: DeletarDemandaDevolucaoQueryDto,
  ) {
    return this.deletarDemandaDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
    });
  }
}
