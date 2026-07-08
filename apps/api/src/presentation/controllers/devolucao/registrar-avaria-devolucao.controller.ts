import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  RegistrarAvariaDevolucaoBodyDto,
  RegistrarAvariaDevolucaoResponseDto,
} from '../../../application/dtos/devolucao/registrar-conferencia-devolucao.dto.js';
import { RegistrarAvariaDevolucaoUseCase } from '../../../application/usecases/devolucao/registrar-avaria-devolucao.usecase.js';
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
export class RegistrarAvariaDevolucaoController {
  constructor(
    private readonly registrarAvariaDevolucaoUseCase: RegistrarAvariaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'devolucao_avaria' })
  @Post(':id/avarias')
  @ApiOperation({
    summary: 'Registrar avaria em demanda de devolução',
    operationId: 'registrarAvariaDevolucao',
  })
  @ApiSuccessResponse(RegistrarAvariaDevolucaoResponseDto, 'created')
  handle(@Param('id') id: string, @Body() body: RegistrarAvariaDevolucaoBodyDto) {
    return this.registrarAvariaDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: body.unidadeId,
      itemId: body.itemId ?? null,
      tipo: body.tipo,
      natureza: body.natureza ?? null,
      causa: body.causa ?? null,
      quantidadeCaixa: body.quantidadeCaixa ?? null,
      quantidadeUnidade: body.quantidadeUnidade ?? null,
      observacao: body.observacao ?? null,
      photoUrls: body.photoUrls ?? [],
      replicarSkus: body.replicarSkus ?? [],
    });
  }
}
