import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ExcluirMapaConferenciaReentregaTransporteUseCase } from '../../../application/usecases/expedicao/excluir-mapa-conferencia-reentrega-transporte.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const DeleteMapaConferenciaReentregaTransporteQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class DeleteMapaConferenciaReentregaTransporteQueryDto extends createZodDto(
  DeleteMapaConferenciaReentregaTransporteQuerySchema,
) {}

const DeleteMapaConferenciaReentregaTransporteResponseSchema = z.object({
  transporteId: z.string(),
  loteIdsExcluidos: z.array(z.string().uuid()),
});

class DeleteMapaConferenciaReentregaTransporteResponseDto extends createZodDto(
  DeleteMapaConferenciaReentregaTransporteResponseSchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteMapaConferenciaReentregaTransporteController {
  constructor(
    private readonly excluirMapaConferenciaReentregaTransporteUseCase: ExcluirMapaConferenciaReentregaTransporteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Delete(':transporteId/mapa-conferencia-reentrega')
  @ApiOperation({
    summary: 'Excluir mapa de conferência reentrega do transporte',
    operationId: 'deleteMapaConferenciaReentregaTransporte',
  })
  @ApiSuccessResponse(
    DeleteMapaConferenciaReentregaTransporteResponseDto,
    'deleted',
  )
  handle(
    @Param('transporteId') transporteId: string,
    @Query() query: DeleteMapaConferenciaReentregaTransporteQueryDto,
  ) {
    return this.excluirMapaConferenciaReentregaTransporteUseCase.execute({
      transporteId,
      unidadeId: query.unidadeId,
    });
  }
}
