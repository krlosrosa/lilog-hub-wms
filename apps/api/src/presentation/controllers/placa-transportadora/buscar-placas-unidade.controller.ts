import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BuscarPlacasUnidadeResponseDto } from '../../../application/dtos/placa-transportadora/placa-transportadora.dto.js';
import { BuscarPlacasUnidadeUseCase } from '../../../application/usecases/placa-transportadora/buscar-placas-unidade.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const BuscarPlacasUnidadeBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  placas: z.array(z.string().min(1).max(20)).min(1).max(200),
});

class BuscarPlacasUnidadeBodyDto extends createZodDto(
  BuscarPlacasUnidadeBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarPlacasUnidadeController {
  constructor(
    private readonly buscarPlacasUnidadeUseCase: BuscarPlacasUnidadeUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.VIEW)
  @Post('placas/buscar')
  @ApiOperation({
    summary: 'Buscar placas cadastradas por lista de placas na unidade',
    operationId: 'buscarPlacasUnidade',
  })
  @ApiSuccessResponse(BuscarPlacasUnidadeResponseDto)
  handle(@Body() body: BuscarPlacasUnidadeBodyDto) {
    return this.buscarPlacasUnidadeUseCase.execute({
      unidadeId: body.unidadeId,
      placas: body.placas,
    });
  }
}
