import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ValidarFaltaPesoResponseDto } from '../../../application/dtos/devolucao/falta-peso-devolucao.dto.js';
import { ValidarFaltaPesoDevolucaoUseCase } from '../../../application/usecases/devolucao/validar-falta-peso-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const ValidarFaltaPesoDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  status: z.enum(['validada', 'rejeitada']),
});

class ValidarFaltaPesoDevolucaoBodyDto extends createZodDto(
  ValidarFaltaPesoDevolucaoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ValidarFaltaPesoDevolucaoController {
  constructor(
    private readonly validarFaltaPesoDevolucaoUseCase: ValidarFaltaPesoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'devolucao_falta_peso' })
  @Patch(':id/faltas-peso/:faltaPesoId')
  @ApiOperation({
    summary: 'Validar ou rejeitar falta de peso de devolução',
    operationId: 'validarFaltaPesoDevolucao',
  })
  @ApiSuccessResponse(ValidarFaltaPesoResponseDto)
  handle(
    @Param('id') id: string,
    @Param('faltaPesoId') faltaPesoId: string,
    @Body() body: ValidarFaltaPesoDevolucaoBodyDto,
  ) {
    return this.validarFaltaPesoDevolucaoUseCase.execute({
      faltaPesoId,
      demandaId: id,
      unidadeId: body.unidadeId,
      status: body.status,
    });
  }
}
