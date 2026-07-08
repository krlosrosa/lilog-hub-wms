import {
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteMotivoBloqueioSaldoUseCase } from '../../../application/usecases/estoque/delete-motivo-bloqueio-saldo.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/motivos-bloqueio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteMotivoBloqueioSaldoController {
  constructor(
    private readonly deleteMotivoBloqueioSaldoUseCase: DeleteMotivoBloqueioSaldoUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remover motivo de bloqueio de saldo',
    operationId: 'deleteMotivoBloqueioSaldo',
  })
  async handle(@Param('id') id: string) {
    await this.deleteMotivoBloqueioSaldoUseCase.execute(id);
  }
}
