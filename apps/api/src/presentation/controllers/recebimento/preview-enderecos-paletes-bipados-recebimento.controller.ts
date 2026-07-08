import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PreviewPaletesBipadosResponseDto } from '../../../application/dtos/recebimento/etiqueta-armazenagem.dto.js';
import { PreviewEnderecosPaletesBipadosRecebimentoUseCase } from '../../../application/usecases/recebimento/preview-enderecos-paletes-bipados-recebimento.usecase.js';
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
export class PreviewEnderecosPaletesBipadosRecebimentoController {
  constructor(
    private readonly previewEnderecosPaletesBipadosRecebimentoUseCase: PreviewEnderecosPaletesBipadosRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.FINALIZAR)
  @Get(':id/armazenagem/preview-paletes-bipados')
  @ApiOperation({
    summary: 'Preview de endereços sugeridos para paletes bipados no recebimento',
    operationId: 'previewEnderecosPaletesBipadosRecebimento',
  })
  @ApiSuccessResponse(PreviewPaletesBipadosResponseDto)
  handle(@Param('id') id: string) {
    return this.previewEnderecosPaletesBipadosRecebimentoUseCase.execute({
      recebimentoId: id,
    });
  }
}
