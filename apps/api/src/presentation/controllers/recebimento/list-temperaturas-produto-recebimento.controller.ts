import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ListTemperaturasProdutoRecebimentoUseCase } from '../../../application/usecases/recebimento/list-temperaturas-produto-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import { TemperaturaProdutoEtapaSchema } from '../../../domain/model/recebimento/recebimento.model.js';

const ListTemperaturasProdutoResponseSchema = z.object({
  recebimentoId: z.uuid(),
  items: z.array(
    z.object({
      etapa: TemperaturaProdutoEtapaSchema,
      temperatura: z.number(),
      medidoEm: z.string(),
    }),
  ),
});

class ListTemperaturasProdutoResponseDto extends createZodDto(
  ListTemperaturasProdutoResponseSchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListTemperaturasProdutoRecebimentoController {
  constructor(
    private readonly listTemperaturasProdutoRecebimentoUseCase: ListTemperaturasProdutoRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Get(':id/temperaturas-produto')
  @ApiOperation({
    summary: 'Listar temperaturas do produto por etapa do baú',
    operationId: 'listTemperaturasProdutoRecebimento',
  })
  @ApiSuccessResponse(ListTemperaturasProdutoResponseDto)
  handle(@Param('id') id: string) {
    return this.listTemperaturasProdutoRecebimentoUseCase.execute(id);
  }
}
