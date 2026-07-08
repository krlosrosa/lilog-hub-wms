import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RegistrarFaltaPesoResponseDto } from '../../../application/dtos/devolucao/falta-peso-devolucao.dto.js';
import { RegistrarFaltaPesoDevolucaoUseCase } from '../../../application/usecases/devolucao/registrar-falta-peso-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const RegistrarFaltaPesoDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  notaFiscalId: z.uuid(),
  itemId: z.uuid(),
  sku: z.string().min(1).max(50),
  diferencaKg: z.number().positive(),
  zerarQuantidadeContabil: z.boolean().optional().default(true),
  observacao: z.string().max(2000).nullable().optional(),
});

class RegistrarFaltaPesoDevolucaoBodyDto extends createZodDto(
  RegistrarFaltaPesoDevolucaoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RegistrarFaltaPesoDevolucaoController {
  constructor(
    private readonly registrarFaltaPesoDevolucaoUseCase: RegistrarFaltaPesoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'devolucao_falta_peso' })
  @Post(':id/faltas-peso')
  @ApiOperation({
    summary: 'Registrar falta de peso em item variável de devolução',
    operationId: 'registrarFaltaPesoDevolucao',
  })
  @ApiSuccessResponse(RegistrarFaltaPesoResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: RegistrarFaltaPesoDevolucaoBodyDto,
  ) {
    return this.registrarFaltaPesoDevolucaoUseCase.execute({
      demandaId: id,
      unidadeId: body.unidadeId,
      notaFiscalId: body.notaFiscalId,
      itemId: body.itemId,
      sku: body.sku,
      diferencaKg: body.diferencaKg,
      zerarQuantidadeContabil: body.zerarQuantidadeContabil,
      observacao: body.observacao ?? null,
    });
  }
}
