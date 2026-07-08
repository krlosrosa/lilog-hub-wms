import { Body, Controller, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarStatusDemandaDevolucaoQueryDto,
  AtualizarStatusDemandaDevolucaoResponseDto,
  DemandaDevolucaoStatusSchema,
} from '../../../application/dtos/devolucao/listar-demandas-devolucao.dto.js';
import { AtualizarStatusDemandaDevolucaoUseCase } from '../../../application/usecases/devolucao/atualizar-status-demanda-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarStatusDemandaDevolucaoBodySchema = z.object({
  status: DemandaDevolucaoStatusSchema,
  observacao: z.string().max(2000).optional(),
  doca: z.string().max(100).nullable().optional(),
  cargaSegregada: z.boolean().optional(),
  paletesEsperados: z.coerce.number().int().min(0).nullable().optional(),
});

class AtualizarStatusDemandaDevolucaoBodyDto extends createZodDto(
  AtualizarStatusDemandaDevolucaoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarStatusDemandaDevolucaoController {
  constructor(
    private readonly atualizarStatusDemandaDevolucaoUseCase: AtualizarStatusDemandaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'demanda_devolucao_status' })
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status de uma demanda de devolução',
    operationId: 'atualizarStatusDemandaDevolucao',
  })
  @ApiSuccessResponse(AtualizarStatusDemandaDevolucaoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: AtualizarStatusDemandaDevolucaoQueryDto,
    @Body() body: AtualizarStatusDemandaDevolucaoBodyDto,
  ) {
    return this.atualizarStatusDemandaDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: query.unidadeId,
      status: body.status,
      observacao: body.observacao,
      doca: body.doca,
      cargaSegregada: body.cargaSegregada,
      paletesEsperados: body.paletesEsperados,
    });
  }
}
