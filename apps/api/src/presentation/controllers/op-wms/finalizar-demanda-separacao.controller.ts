import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DemandaSeparacaoDto } from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { FinalizarDemandaSeparacaoUseCase } from '../../../application/usecases/op-wms/finalizar-demanda-separacao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const DemandaIdParamSchema = z.object({
  demandaId: z.uuid(),
});

class DemandaIdParamDto extends createZodDto(DemandaIdParamSchema) {}

@ApiTags('OP WMS')
@Controller('op-wms/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class FinalizarDemandaSeparacaoController {
  constructor(
    private readonly finalizarDemandaSeparacaoUseCase: FinalizarDemandaSeparacaoUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post(':demandaId/finalizar')
  @ApiOperation({
    summary: 'Finalizar demanda de separação (mapa)',
    operationId: 'finalizarDemandaSeparacao',
  })
  @ApiSuccessResponse(DemandaSeparacaoDto)
  handle(@Param() params: DemandaIdParamDto) {
    return this.finalizarDemandaSeparacaoUseCase.execute(params.demandaId);
  }
}
