import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransportadoraResponseDto } from '../../../application/dtos/transportadora/transportadora.dto.js';
import { UpdateTransportadoraUseCase } from '../../../application/usecases/transportadora/update-transportadora.usecase.js';
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

const UpdateTransportadoraBodySchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  cnpj: z.string().min(1).max(18).optional(),
  status: TransportadoraStatusSchema.optional(),
  quantidadeVeiculos: z.number().int().nonnegative().optional(),
});

class UpdateTransportadoraBodyDto extends createZodDto(
  UpdateTransportadoraBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateTransportadoraController {
  constructor(
    private readonly updateTransportadoraUseCase: UpdateTransportadoraUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'transportadora' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update transportadora',
    operationId: 'updateTransportadora',
  })
  @ApiSuccessResponse(TransportadoraResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateTransportadoraBodyDto,
  ) {
    return this.updateTransportadoraUseCase.execute(id, body);
  }
}
