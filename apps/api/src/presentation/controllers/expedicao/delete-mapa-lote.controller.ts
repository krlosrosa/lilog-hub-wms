import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ExcluirMapaLoteUseCase } from '../../../application/usecases/expedicao/excluir-mapa-lote.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const DeleteMapaLoteQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class DeleteMapaLoteQueryDto extends createZodDto(DeleteMapaLoteQuerySchema) {}

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteMapaLoteController {
  constructor(
    private readonly excluirMapaLoteUseCase: ExcluirMapaLoteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'delete', resource: 'mapa_lote' })
  @Delete(':loteId')
  @ApiOperation({
    summary: 'Excluir lote de mapas',
    operationId: 'deleteMapaLote',
  })
  handle(
    @Param('loteId') loteId: string,
    @Query() query: DeleteMapaLoteQueryDto,
  ) {
    return this.excluirMapaLoteUseCase.execute({
      loteId,
      unidadeId: query.unidadeId,
    });
  }
}
