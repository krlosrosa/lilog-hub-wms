import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  RegistrarConferenciaItensBodyDto,
  RegistrarConferenciaItensResponseDto,
} from '../../../application/dtos/devolucao/registrar-conferencia-devolucao.dto.js';
import { RegistrarConferenciaItensUseCase } from '../../../application/usecases/devolucao/registrar-conferencia-itens.usecase.js';
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
export class RegistrarConferenciaItensController {
  constructor(
    private readonly registrarConferenciaItensUseCase: RegistrarConferenciaItensUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'devolucao_conferencia' })
  @Patch(':id/conferencia')
  @ApiOperation({
    summary: 'Registrar conferência de itens de devolução',
    operationId: 'registrarConferenciaItensDevolucao',
  })
  @ApiSuccessResponse(RegistrarConferenciaItensResponseDto)
  handle(@Param('id') id: string, @Body() body: RegistrarConferenciaItensBodyDto) {
    return this.registrarConferenciaItensUseCase.execute({
      demandaId: id,
      unidadeId: body.unidadeId,
      status: body.status,
      itens: body.itens,
    });
  }
}
