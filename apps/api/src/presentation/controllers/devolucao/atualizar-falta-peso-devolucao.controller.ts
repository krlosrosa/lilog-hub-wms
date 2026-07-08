import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ValidarFaltaPesoResponseDto } from '../../../application/dtos/devolucao/falta-peso-devolucao.dto.js';
import { AtualizarFaltaPesoDevolucaoUseCase } from '../../../application/usecases/devolucao/atualizar-falta-peso-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarFaltaPesoDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  diferencaKg: z.number().positive(),
  zerarQuantidadeContabil: z.boolean(),
  observacao: z.string().max(2000).nullable().optional(),
});

class AtualizarFaltaPesoDevolucaoBodyDto extends createZodDto(
  AtualizarFaltaPesoDevolucaoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarFaltaPesoDevolucaoController {
  constructor(
    private readonly atualizarFaltaPesoDevolucaoUseCase: AtualizarFaltaPesoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'devolucao_falta_peso' })
  @Put(':id/faltas-peso/:faltaPesoId')
  @ApiOperation({
    summary: 'Atualizar falta de peso de devolução',
    operationId: 'atualizarFaltaPesoDevolucao',
  })
  @ApiSuccessResponse(ValidarFaltaPesoResponseDto)
  handle(
    @Param('id') id: string,
    @Param('faltaPesoId') faltaPesoId: string,
    @Body() body: AtualizarFaltaPesoDevolucaoBodyDto,
  ) {
    return this.atualizarFaltaPesoDevolucaoUseCase.execute({
      faltaPesoId,
      demandaId: id,
      unidadeId: body.unidadeId,
      diferencaKg: body.diferencaKg,
      zerarQuantidadeContabil: body.zerarQuantidadeContabil,
      observacao: body.observacao ?? null,
    });
  }
}
