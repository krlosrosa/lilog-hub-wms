import { Body, Controller, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarStatusProcessoDebitoQueryDto,
  AtualizarStatusProcessoDebitoResponseDto,
  ProcessoDebitoStatusSchema,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { AtualizarStatusProcessoDebitoUseCase } from '../../../application/usecases/cobranca-transportadora/atualizar-status-processo-debito.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarStatusProcessoDebitoBodySchema = z.object({
  status: ProcessoDebitoStatusSchema,
  observacao: z.string().max(2000).optional(),
});

class AtualizarStatusProcessoDebitoBodyDto extends createZodDto(
  AtualizarStatusProcessoDebitoBodySchema,
) {}

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarStatusProcessoDebitoController {
  constructor(
    private readonly atualizarStatusProcessoDebitoUseCase: AtualizarStatusProcessoDebitoUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'processo_debito_status' })
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status de processo de débito',
    operationId: 'atualizarStatusProcessoDebito',
  })
  @ApiSuccessResponse(AtualizarStatusProcessoDebitoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: AtualizarStatusProcessoDebitoQueryDto,
    @Body() body: AtualizarStatusProcessoDebitoBodyDto,
  ) {
    return this.atualizarStatusProcessoDebitoUseCase.execute({
      processoId: id,
      unidadeId: query.unidadeId,
      status: body.status,
      observacao: body.observacao,
    });
  }
}
