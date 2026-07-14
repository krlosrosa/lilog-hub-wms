import {
  Controller,
  Get,
  Param,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';

import { GetRelatorioItensConferidosUseCase } from '../../../application/usecases/recebimento/get-relatorio-itens-conferidos.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRelatorioItensConferidosController {
  constructor(
    private readonly getRelatorioItensConferidosUseCase: GetRelatorioItensConferidosUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Get(':id/relatorio/itens-conferidos')
  @ApiOperation({
    summary: 'Baixar relatório XLSX dos itens conferidos com abatimento de avarias',
    operationId: 'getRelatorioItensConferidos',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async handle(@Param('id') id: string) {
    const result = await this.getRelatorioItensConferidosUseCase.execute({
      recebimentoId: id,
    });

    return new StreamableFile(result.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
