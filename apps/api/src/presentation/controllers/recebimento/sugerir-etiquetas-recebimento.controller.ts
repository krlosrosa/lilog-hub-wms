import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SugestaoEtiquetasRecebimentoResponseDto } from '../../../application/dtos/recebimento/etiqueta-armazenagem.dto.js';
import { SugerirEtiquetasRecebimentoUseCase } from '../../../application/usecases/recebimento/sugerir-etiquetas-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SugerirEtiquetasRecebimentoController {
  constructor(
    private readonly sugerirEtiquetasRecebimentoUseCase: SugerirEtiquetasRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.FINALIZAR)
  @Get(':id/etiquetas/sugestao')
  @ApiOperation({
    summary: 'Sugerir quantidade de paletes para etiquetas de armazenagem',
    operationId: 'sugerirEtiquetasRecebimento',
  })
  @ApiSuccessResponse(SugestaoEtiquetasRecebimentoResponseDto)
  handle(@Param('id') id: string) {
    return this.sugerirEtiquetasRecebimentoUseCase.execute({
      recebimentoId: id,
    });
  }
}
