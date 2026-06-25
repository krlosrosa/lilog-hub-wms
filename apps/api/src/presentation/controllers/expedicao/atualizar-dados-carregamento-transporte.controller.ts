import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AtualizarDadosCarregamentoTransporteUseCase } from '../../../application/usecases/expedicao/atualizar-dados-carregamento-transporte.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const PatchDadosCarregamentoTransporteBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  docaId: z.uuid().nullable().optional(),
  lacreCarregamento: z.string().max(100).nullable().optional(),
});

class PatchDadosCarregamentoTransporteBodyDto extends createZodDto(
  PatchDadosCarregamentoTransporteBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarDadosCarregamentoTransporteController {
  constructor(
    private readonly atualizarDadosCarregamentoTransporteUseCase: AtualizarDadosCarregamentoTransporteUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Auditable({ action: 'update', resource: 'transporte_dados_carregamento' })
  @Patch(':transporteId/dados-carregamento')
  @ApiOperation({
    summary: 'Atualizar doca e lacre de carregamento do transporte',
    operationId: 'patchTransporteDadosCarregamento',
  })
  handle(
    @Param('transporteId') transporteId: string,
    @Body() body: PatchDadosCarregamentoTransporteBodyDto,
  ) {
    return this.atualizarDadosCarregamentoTransporteUseCase.execute({
      transporteId,
      unidadeId: body.unidadeId,
      docaId: body.docaId,
      lacreCarregamento: body.lacreCarregamento,
    });
  }
}
