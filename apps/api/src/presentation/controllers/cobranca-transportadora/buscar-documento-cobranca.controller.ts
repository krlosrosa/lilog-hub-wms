import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  BuscarDocumentoCobrancaQueryDto,
  BuscarDocumentoCobrancaResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-documentos-cobranca.dto.js';
import { BuscarDocumentoCobrancaUseCase } from '../../../application/usecases/cobranca-transportadora/buscar-documento-cobranca.usecase.js';
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
export class BuscarDocumentoCobrancaController {
  constructor(
    private readonly buscarDocumentoCobrancaUseCase: BuscarDocumentoCobrancaUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhe de documento de cobrança',
    operationId: 'buscarDocumentoCobranca',
  })
  @ApiSuccessResponse(BuscarDocumentoCobrancaResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: BuscarDocumentoCobrancaQueryDto,
  ) {
    return this.buscarDocumentoCobrancaUseCase.execute({
      documentoId: id,
      unidadeId: query.unidadeId,
    });
  }
}
