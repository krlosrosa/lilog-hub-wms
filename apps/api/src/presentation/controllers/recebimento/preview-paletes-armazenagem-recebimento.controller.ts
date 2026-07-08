import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreviewPaletesArmazenagemResponseDto } from '../../../application/dtos/recebimento/etiqueta-armazenagem.dto.js';
import { PreviewPaletesArmazenagemRecebimentoUseCase } from '../../../application/usecases/recebimento/preview-paletes-armazenagem-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const PreviewPaletesBodySchema = z.object({
  paletes: z.array(
    z.object({
      produtoId: z.string().min(1).max(50),
      qtdPaletes: z.number().int().min(1),
    }),
  ),
});

class PreviewPaletesBodyDto extends createZodDto(PreviewPaletesBodySchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class PreviewPaletesArmazenagemRecebimentoController {
  constructor(
    private readonly previewPaletesArmazenagemRecebimentoUseCase: PreviewPaletesArmazenagemRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.FINALIZAR)
  @Post(':id/armazenagem/preview-paletes')
  @ApiOperation({
    summary: 'Preview de paletes e endereços sugeridos antes da finalização',
    operationId: 'previewPaletesArmazenagemRecebimento',
  })
  @ApiSuccessResponse(PreviewPaletesArmazenagemResponseDto)
  handle(@Param('id') id: string, @Body() body: PreviewPaletesBodyDto) {
    return this.previewPaletesArmazenagemRecebimentoUseCase.execute({
      recebimentoId: id,
      paletes: body.paletes,
    });
  }
}
