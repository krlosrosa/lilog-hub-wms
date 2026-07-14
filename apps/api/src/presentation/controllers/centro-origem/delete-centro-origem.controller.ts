import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteCentroOrigemUseCase } from '../../../application/usecases/centro-origem/delete-centro-origem.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Centro de Origem')
@Controller('centros-origem')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteCentroOrigemController {
  constructor(
    private readonly deleteCentroOrigemUseCase: DeleteCentroOrigemUseCase,
  ) {}

  @Auditable({ action: 'delete', resource: 'centro_origem', capturePayload: false })
  @Delete(':centro')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete centro de origem',
    operationId: 'deleteCentroOrigem',
  })
  async handle(@Param('centro') centro: string) {
    await this.deleteCentroOrigemUseCase.execute(centro);
  }
}
