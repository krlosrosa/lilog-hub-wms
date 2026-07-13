import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlacaVeiculoSchema } from '@lilog/contracts';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { RecepcionarCarroUseCase } from '../../../application/usecases/recebimento/recepcionar-carro.usecase.js';
import {
  GrauPrioridadePreRecebimentoSchema,
} from '../../../domain/model/recebimento/recebimento.model.js';
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

const RecepcionarCarroBodySchema = z.object({
  motoristaNome: z.string().min(1).max(255),
  placa: PlacaVeiculoSchema,
  motoristaTelefone: z.string().max(20).optional(),
  dataChegada: z.iso.datetime().optional(),
  grauPrioridade: GrauPrioridadePreRecebimentoSchema.optional(),
  quantidadePaletesEsperada: z.number().int().min(0).optional(),
  numeroTermoPalete: z.string().max(100).optional(),
});

class RecepcionarCarroBodyDto extends createZodDto(RecepcionarCarroBodySchema) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RecepcionarCarroController {
  constructor(
    private readonly recepcionarCarroUseCase: RecepcionarCarroUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.INICIAR)
  @Auditable({ action: 'recepcionar-carro', resource: 'pre-recebimento' })
  @Patch(':id/recepcionar-carro')
  @ApiOperation({
    summary: 'Register vehicle arrival at reception',
    operationId: 'recepcionarCarro',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: RecepcionarCarroBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.recepcionarCarroUseCase.execute({
      id,
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
