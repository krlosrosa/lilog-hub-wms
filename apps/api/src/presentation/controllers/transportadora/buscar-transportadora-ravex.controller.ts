import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  BuscarTransportadoraRavexQueryDto,
  TransportadoraRavexPreviewDto,
} from '../../../application/dtos/transportadora/transportadora.dto.js';
import { BuscarTransportadoraRavexUseCase } from '../../../application/usecases/transportadora/buscar-transportadora-ravex.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const IdRavexParamSchema = z.coerce.number().int().positive();

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarTransportadoraRavexController {
  constructor(
    private readonly buscarTransportadoraRavexUseCase: BuscarTransportadoraRavexUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.IMPORT_RAVEX)
  @Get('ravex/:idRavexTransportadora')
  @ApiOperation({
    summary: 'Preview transportadora data from Ravex',
    operationId: 'buscarTransportadoraRavex',
  })
  @ApiSuccessResponse(TransportadoraRavexPreviewDto, 'ok')
  handle(
    @Param('idRavexTransportadora') idRavexTransportadora: string,
    @Query() query: BuscarTransportadoraRavexQueryDto,
  ) {
    const parsedId = IdRavexParamSchema.parse(idRavexTransportadora);

    return this.buscarTransportadoraRavexUseCase.execute({
      unidadeId: query.unidadeId,
      idRavexTransportadora: parsedId,
    });
  }
}
