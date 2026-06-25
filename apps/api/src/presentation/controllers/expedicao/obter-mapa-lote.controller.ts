import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

import { MapaLoteDetalheDto } from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import { ObterMapaLoteUseCase } from '../../../application/usecases/expedicao/obter-mapa-lote.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const ObterMapaLoteQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class ObterMapaLoteQueryDto extends createZodDto(ObterMapaLoteQuerySchema) {}

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ObterMapaLoteController {
  constructor(private readonly obterMapaLoteUseCase: ObterMapaLoteUseCase) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get(':loteId')
  @ApiOperation({
    summary: 'Obter lote de mapas por id',
    operationId: 'obterMapaLote',
  })
  @ApiSuccessResponse(MapaLoteDetalheDto)
  handle(
    @Param('loteId') loteId: string,
    @Query() query: ObterMapaLoteQueryDto,
  ) {
    return this.obterMapaLoteUseCase.execute({
      loteId,
      unidadeId: query.unidadeId,
    });
  }
}
