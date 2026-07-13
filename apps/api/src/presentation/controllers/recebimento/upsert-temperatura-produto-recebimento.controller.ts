import { Body, Controller, Param, Put, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UpsertTemperaturaProdutoRecebimentoUseCase } from '../../../application/usecases/recebimento/upsert-temperatura-produto-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import { TemperaturaProdutoEtapaSchema } from '../../../domain/model/recebimento/recebimento.model.js';

const UpsertTemperaturaProdutoBodySchema = z.object({
  etapa: TemperaturaProdutoEtapaSchema,
  temperatura: z.number(),
});

class UpsertTemperaturaProdutoBodyDto extends createZodDto(
  UpsertTemperaturaProdutoBodySchema,
) {}

const UpsertTemperaturaProdutoResponseSchema = z.object({
  id: z.uuid(),
  recebimentoId: z.uuid(),
  etapa: TemperaturaProdutoEtapaSchema,
  temperatura: z.number(),
  medidoEm: z.string(),
});

class UpsertTemperaturaProdutoResponseDto extends createZodDto(
  UpsertTemperaturaProdutoResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpsertTemperaturaProdutoRecebimentoController {
  constructor(
    private readonly upsertTemperaturaProdutoRecebimentoUseCase: UpsertTemperaturaProdutoRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'upsert', resource: 'recebimento_temperatura_produto' })
  @Put(':id/temperaturas-produto')
  @ApiOperation({
    summary: 'Registrar temperatura do produto em uma etapa do baú',
    operationId: 'upsertTemperaturaProdutoRecebimento',
  })
  @ApiSuccessResponse(UpsertTemperaturaProdutoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpsertTemperaturaProdutoBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.upsertTemperaturaProdutoRecebimentoUseCase.execute({
      recebimentoId: id,
      data: body,
      operatorId: req.user.id,
    });
  }
}
