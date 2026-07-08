import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CriarDocumentoCobrancaResponseDto } from '../../../application/dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import { CriarDocumentoCobrancaUseCase } from '../../../application/usecases/cobranca-transportadora/criar-documento-cobranca.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarDocumentoCobrancaBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transportadoraId: z.uuid().nullable().optional(),
  transportadoraNome: z.string().min(1).max(255),
  processoDebitoIds: z.array(z.uuid()).min(1),
  observacao: z.string().max(2000).optional(),
});

class CriarDocumentoCobrancaBodyDto extends createZodDto(
  CriarDocumentoCobrancaBodySchema,
) {}

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarDocumentoCobrancaController {
  constructor(
    private readonly criarDocumentoCobrancaUseCase: CriarDocumentoCobrancaUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'documento_cobranca' })
  @Post()
  @ApiOperation({
    summary: 'Criar documento de cobrança de transportadora',
    operationId: 'criarDocumentoCobranca',
  })
  @ApiSuccessResponse(CriarDocumentoCobrancaResponseDto, 'created')
  handle(@Body() body: CriarDocumentoCobrancaBodyDto) {
    return this.criarDocumentoCobrancaUseCase.execute(body);
  }
}
