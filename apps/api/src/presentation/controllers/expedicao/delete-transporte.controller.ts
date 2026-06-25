import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ExcluirTransporteUseCase } from '../../../application/usecases/expedicao/excluir-transporte.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const DeleteTransporteQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class DeleteTransporteQueryDto extends createZodDto(DeleteTransporteQuerySchema) {}

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteTransporteController {
  constructor(
    private readonly excluirTransporteUseCase: ExcluirTransporteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'delete', resource: 'transporte' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir transporte de expedição',
    operationId: 'deleteTransporte',
  })
  handle(
    @Param('id') id: string,
    @Query() query: DeleteTransporteQueryDto,
  ) {
    return this.excluirTransporteUseCase.execute({
      id,
      unidadeId: query.unidadeId,
    });
  }
}
