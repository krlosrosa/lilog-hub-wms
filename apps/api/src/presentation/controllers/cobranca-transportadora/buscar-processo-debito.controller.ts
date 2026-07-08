import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  BuscarProcessoDebitoQueryDto,
  BuscarProcessoDebitoResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { BuscarProcessoDebitoUseCase } from '../../../application/usecases/cobranca-transportadora/buscar-processo-debito.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarProcessoDebitoController {
  constructor(
    private readonly buscarProcessoDebitoUseCase: BuscarProcessoDebitoUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhe de processo de débito',
    operationId: 'buscarProcessoDebito',
  })
  @ApiSuccessResponse(BuscarProcessoDebitoResponseDto)
  handle(@Param('id') id: string, @Query() query: BuscarProcessoDebitoQueryDto) {
    return this.buscarProcessoDebitoUseCase.execute({
      processoId: id,
      unidadeId: query.unidadeId,
    });
  }
}
