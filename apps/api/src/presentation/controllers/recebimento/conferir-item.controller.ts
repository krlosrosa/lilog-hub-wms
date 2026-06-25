import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ConferirItemCegoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { ConferirItemUseCase } from '../../../application/usecases/recebimento/conferir-item.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const ConferirItemBodySchema = z.object({
  produtoId: z.uuid(),
  quantidadeRecebida: z.number().nonnegative(),
  unidadeMedida: z.string().min(1).max(20),
  loteRecebido: z.string().optional(),
  pesoRecebido: z.number().positive().optional(),
  validade: z.iso.datetime().optional(),
  numeroSerie: z.string().optional(),
  unitizadorCodigo: z.string().min(1).optional(),
});

class ConferirItemBodyDto extends createZodDto(ConferirItemBodySchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ConferirItemController {
  constructor(private readonly conferirItemUseCase: ConferirItemUseCase) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'conferir', resource: 'recebimento' })
  @Post(':id/itens')
  @ApiOperation({
    summary: 'Conferir item (blind count)',
    operationId: 'conferirItem',
  })
  @ApiSuccessResponse(ConferirItemCegoResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: ConferirItemBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.conferirItemUseCase.execute({
      recebimentoId: id,
      data: {
        ...body,
        validade: body.validade ? new Date(body.validade) : undefined,
      },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
