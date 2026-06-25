import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ListRecebimentoAvariasResponseDto } from '../../../application/dtos/recebimento/recebimento-avaria.dto.js';
import { RegistrarAvariaUseCase } from '../../../application/usecases/recebimento/registrar-avaria.usecase.js';
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

const RegistrarAvariaBodySchema = z
  .object({
    produtoId: z.uuid().optional(),
    tipo: z.string().min(1),
    natureza: z.string().min(1),
    causa: z.string().min(1),
    quantidadeCaixas: z.coerce.number().int().min(0),
    quantidadeUnidades: z.coerce.number().int().min(0),
    photoCount: z.coerce.number().int().min(0).default(0),
    replicarParaTodos: z.boolean().optional(),
    skusAlvo: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) => data.quantidadeCaixas > 0 || data.quantidadeUnidades > 0,
    {
      message: 'Informe caixas e/ou unidades avariadas',
      path: ['quantidadeUnidades'],
    },
  );

class RegistrarAvariaBodyDto extends createZodDto(RegistrarAvariaBodySchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RegistrarAvariaController {
  constructor(
    private readonly registrarAvariaUseCase: RegistrarAvariaUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'create', resource: 'recebimento_avaria' })
  @Post(':id/avarias')
  @ApiOperation({
    summary: 'Registrar avaria no recebimento',
    operationId: 'registrarRecebimentoAvaria',
  })
  @ApiSuccessResponse(ListRecebimentoAvariasResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: RegistrarAvariaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.registrarAvariaUseCase.execute({
      recebimentoId: id,
      ...body,
      operatorId: user?.id ?? 0,
    });
  }
}
