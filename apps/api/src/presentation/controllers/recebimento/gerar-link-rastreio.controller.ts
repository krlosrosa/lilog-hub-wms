import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { GerarLinkRastreioResponseDto } from '../../../application/dtos/recebimento/rastreio-status.dto.js';
import { GerarLinkRastreioUseCase } from '../../../application/usecases/recebimento/gerar-link-rastreio.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const GerarLinkRastreioBodySchema = z.object({
  regenerar: z.boolean().optional(),
});

class GerarLinkRastreioBodyDto extends createZodDto(
  GerarLinkRastreioBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GerarLinkRastreioController {
  constructor(
    private readonly gerarLinkRastreioUseCase: GerarLinkRastreioUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Auditable({ action: 'gerar-link-rastreio', resource: 'pre-recebimento' })
  @Post(':id/gerar-link-rastreio')
  @ApiOperation({
    summary: 'Generate driver tracking link for pre-recebimento',
    operationId: 'gerarLinkRastreio',
  })
  @ApiSuccessResponse(GerarLinkRastreioResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: GerarLinkRastreioBodyDto,
  ) {
    return this.gerarLinkRastreioUseCase.execute({
      preRecebimentoId: id,
      regenerar: body.regenerar,
    });
  }
}
