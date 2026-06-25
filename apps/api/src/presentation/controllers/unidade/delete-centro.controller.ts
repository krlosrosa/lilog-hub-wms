import {
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteCentroUseCase } from '../../../application/usecases/unidade/delete-centro.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteCentroController {
  constructor(private readonly deleteCentroUseCase: DeleteCentroUseCase) {}

  @Auditable({ action: 'delete', resource: 'centro', capturePayload: false })
  @Delete(':id/centros/:centroId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete centro',
    operationId: 'deleteCentro',
  })
  async handle(
    @Param('id') id: string,
    @Param('centroId') centroId: string,
  ) {
    await this.deleteCentroUseCase.execute(id, centroId);
  }
}
