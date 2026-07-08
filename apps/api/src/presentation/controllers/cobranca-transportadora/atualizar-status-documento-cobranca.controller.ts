import { Body, Controller, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarStatusDocumentoCobrancaQueryDto,
  AtualizarStatusDocumentoCobrancaResponseDto,
  DocumentoCobrancaStatusSchema,
} from '../../../application/dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import { AtualizarStatusDocumentoCobrancaUseCase } from '../../../application/usecases/cobranca-transportadora/atualizar-status-documento-cobranca.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarStatusDocumentoCobrancaBodySchema = z.object({
  status: DocumentoCobrancaStatusSchema,
  observacao: z.string().max(2000).optional(),
});

class AtualizarStatusDocumentoCobrancaBodyDto extends createZodDto(
  AtualizarStatusDocumentoCobrancaBodySchema,
) {}

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarStatusDocumentoCobrancaController {
  constructor(
    private readonly atualizarStatusDocumentoCobrancaUseCase: AtualizarStatusDocumentoCobrancaUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'documento_cobranca_status' })
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status de documento de cobrança',
    operationId: 'atualizarStatusDocumentoCobranca',
  })
  @ApiSuccessResponse(AtualizarStatusDocumentoCobrancaResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: AtualizarStatusDocumentoCobrancaQueryDto,
    @Body() body: AtualizarStatusDocumentoCobrancaBodyDto,
  ) {
    return this.atualizarStatusDocumentoCobrancaUseCase.execute({
      documentoId: id,
      unidadeId: query.unidadeId,
      status: body.status,
      observacao: body.observacao,
    });
  }
}
