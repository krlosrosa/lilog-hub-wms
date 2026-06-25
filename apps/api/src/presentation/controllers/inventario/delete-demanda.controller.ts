import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteDemandaContagemUseCase } from '../../../application/usecases/inventario/demanda.usecases.js';
import {
  ApiErrorResponses,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Inventario')
@Controller('inventarios/:inventarioId/demandas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteDemandaController {
  constructor(
    private readonly deleteDemandaContagemUseCase: DeleteDemandaContagemUseCase,
  ) {}

  @Auditable({ action: 'delete', resource: 'demanda_contagem' })
  @Delete(':demandaId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete demanda de contagem',
    operationId: 'deleteDemandaContagem',
  })
  async handle(
    @Param('inventarioId') inventarioId: string,
    @Param('demandaId') demandaId: string,
  ) {
    await this.deleteDemandaContagemUseCase.execute(inventarioId, demandaId);
  }
}
