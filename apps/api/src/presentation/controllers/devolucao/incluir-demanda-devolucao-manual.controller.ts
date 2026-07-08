import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { IncluirDemandaDevolucaoManualUseCase } from '../../../application/usecases/devolucao/incluir-demanda-devolucao-manual.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const IncluirDemandaDevolucaoManualBodySchema = z
  .object({
    unidadeId: z.string().min(1),
    viagemId: z.coerce.number().int().positive().optional(),
    numeroTransporte: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.viagemId || data.numeroTransporte), {
    message: 'Informe o ID da viagem RAVEX ou o número do transporte.',
  });

class IncluirDemandaDevolucaoManualBodyDto extends createZodDto(
  IncluirDemandaDevolucaoManualBodySchema,
) {}

const IncluirDemandaDevolucaoManualResponseSchema = z.object({
  created: z.boolean(),
  demanda: z
    .object({
      id: z.string().uuid(),
      codigoDemanda: z.string(),
      status: z.string(),
    })
    .nullable(),
});

class IncluirDemandaDevolucaoManualResponseDto extends createZodDto(
  IncluirDemandaDevolucaoManualResponseSchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class IncluirDemandaDevolucaoManualController {
  constructor(
    private readonly incluirDemandaDevolucaoManualUseCase: IncluirDemandaDevolucaoManualUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'demanda_devolucao_manual' })
  @Post('manual')
  @ApiOperation({
    summary: 'Incluir demanda de devolução manualmente via RAVEX',
    operationId: 'incluirDemandaDevolucaoManual',
  })
  @ApiSuccessResponse(IncluirDemandaDevolucaoManualResponseDto)
  handle(@Body() body: IncluirDemandaDevolucaoManualBodyDto) {
    return this.incluirDemandaDevolucaoManualUseCase.execute({
      unidadeId: body.unidadeId,
      viagemId: body.viagemId,
      numeroTransporte: body.numeroTransporte,
    });
  }
}
