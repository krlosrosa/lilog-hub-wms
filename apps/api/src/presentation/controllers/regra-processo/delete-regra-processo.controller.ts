import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteRegraProcessoUseCase } from '../../../application/usecases/regra-processo/delete-regra-processo.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Regras de Processo')
@Controller('regras-processo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteRegraProcessoController {
  constructor(
    private readonly deleteRegraProcessoUseCase: DeleteRegraProcessoUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete process rule',
    operationId: 'deleteRegraProcesso',
  })
  async handle(@Param('id') id: string) {
    await this.deleteRegraProcessoUseCase.execute(id);
  }
}
