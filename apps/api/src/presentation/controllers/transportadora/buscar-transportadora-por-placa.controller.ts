import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  BuscarTransportadoraRavexQueryDto,
  TransportadoraRavexPreviewDto,
} from '../../../application/dtos/transportadora/transportadora.dto.js';
import { BuscarTransportadoraPorPlacaUseCase } from '../../../application/usecases/transportadora/buscar-transportadora-por-placa.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const PlacaParamSchema = z
  .string()
  .min(7, 'Placa deve ter no mínimo 7 caracteres')
  .max(8, 'Placa deve ter no máximo 8 caracteres')
  .transform((value) => value.trim().toUpperCase());

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarTransportadoraPorPlacaController {
  constructor(
    private readonly buscarTransportadoraPorPlacaUseCase: BuscarTransportadoraPorPlacaUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.IMPORT_RAVEX)
  @Get('ravex/placa/:placa')
  @ApiOperation({
    summary: 'Preview transportadora data from Ravex by vehicle plate',
    operationId: 'buscarTransportadoraRavexPorPlaca',
  })
  @ApiSuccessResponse(TransportadoraRavexPreviewDto, 'ok')
  handle(
    @Param('placa') placa: string,
    @Query() query: BuscarTransportadoraRavexQueryDto,
  ) {
    const parsedPlaca = PlacaParamSchema.parse(placa);

    return this.buscarTransportadoraPorPlacaUseCase.execute({
      unidadeId: query.unidadeId,
      placa: parsedPlaca,
    });
  }
}
