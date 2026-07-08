import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListarDocumentosCobrancaQueryDto,
  ListarDocumentosCobrancaResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import { ListarDocumentosCobrancaUseCase } from '../../../application/usecases/cobranca-transportadora/listar-documentos-cobranca.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarDocumentosCobrancaController {
  constructor(
    private readonly listarDocumentosCobrancaUseCase: ListarDocumentosCobrancaUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar documentos de cobrança de transportadora',
    operationId: 'listarDocumentosCobranca',
  })
  @ApiSuccessResponse(ListarDocumentosCobrancaResponseDto)
  handle(@Query() query: ListarDocumentosCobrancaQueryDto) {
    return this.listarDocumentosCobrancaUseCase.execute(query);
  }
}
