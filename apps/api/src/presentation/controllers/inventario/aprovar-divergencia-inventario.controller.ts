import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DivergenciaInventarioResponseDto,
  toDivergenciaInventarioPersistidaResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { AprovarDivergenciaInventarioUseCase } from '../../../application/usecases/inventario/divergencia.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const AprovarDivergenciaBodySchema = z.object({
  motivoAprovacao: z.string().optional(),
});

class AprovarDivergenciaBodyDto extends createZodDto(
  AprovarDivergenciaBodySchema,
) {}

const AprovarDivergenciaParamSchema = z.object({
  id: z.uuid(),
  divId: z.uuid(),
});

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AprovarDivergenciaInventarioController {
  constructor(
    private readonly aprovarDivergenciaInventarioUseCase: AprovarDivergenciaInventarioUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'inventario_divergencia' })
  @Patch(':id/divergencias/:divId/aprovar')
  @ApiOperation({
    summary: 'Approve inventario divergencia',
    operationId: 'aprovarDivergenciaInventario',
  })
  @ApiSuccessResponse(DivergenciaInventarioResponseDto)
  async handle(
    @Param() params: { id: string; divId: string },
    @Body() body: AprovarDivergenciaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const { id, divId } = AprovarDivergenciaParamSchema.parse(params);
    const updated = await this.aprovarDivergenciaInventarioUseCase.execute(
      id,
      divId,
      getRequestUser(request)?.id ?? null,
      body.motivoAprovacao,
    );

    return toDivergenciaInventarioPersistidaResponse(updated);
  }
}
