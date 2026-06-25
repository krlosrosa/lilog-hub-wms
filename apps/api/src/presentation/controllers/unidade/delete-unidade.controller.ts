import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteUnidadeUseCase } from '../../../application/usecases/unidade/delete-unidade.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
@ApiTags('Unidade')
@Controller('unidades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteUnidadeController {
  constructor(private readonly deleteUnidadeUseCase: DeleteUnidadeUseCase) {}

  @Auditable({ action: 'delete', resource: 'unidade', capturePayload: false })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete unidade',
    operationId: 'deleteUnidade',
  })
  async handle(@Param('id') id: string) {
    await this.deleteUnidadeUseCase.execute(id);
  }
}
