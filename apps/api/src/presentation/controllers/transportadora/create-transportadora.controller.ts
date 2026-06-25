import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransportadoraResponseDto } from '../../../application/dtos/transportadora/transportadora.dto.js';
import { CreateTransportadoraUseCase } from '../../../application/usecases/transportadora/create-transportadora.usecase.js';
import { TransportadoraStatusSchema } from '../../../domain/model/transportadora/transportadora.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateTransportadoraBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavexTransportadora: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  cnpj: z.string().min(1).max(18),
  status: TransportadoraStatusSchema.default('ativa'),
  quantidadeVeiculos: z.number().int().nonnegative().optional(),
  sincronizarPlacas: z.boolean().optional().default(false),
});

class CreateTransportadoraBodyDto extends createZodDto(
  CreateTransportadoraBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateTransportadoraController {
  constructor(
    private readonly createTransportadoraUseCase: CreateTransportadoraUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.CREATE)
  @Auditable({ action: 'create', resource: 'transportadora' })
  @Post()
  @ApiOperation({
    summary: 'Create transportadora',
    operationId: 'createTransportadora',
  })
  @ApiSuccessResponse(TransportadoraResponseDto, 'created')
  handle(@Body() body: CreateTransportadoraBodyDto) {
    return this.createTransportadoraUseCase.execute(body);
  }
}
