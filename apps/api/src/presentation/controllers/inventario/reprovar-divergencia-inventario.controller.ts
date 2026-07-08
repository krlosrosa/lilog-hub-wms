import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DivergenciaInventarioResponseDto,
  toDivergenciaInventarioPersistidaResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { ReprovarDivergenciaInventarioUseCase } from '../../../application/usecases/inventario/divergencia.usecases.js';
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

const ReprovarDivergenciaBodySchema = z.object({
  motivoReprovacao: z.string().min(1),
});

class ReprovarDivergenciaBodyDto extends createZodDto(
  ReprovarDivergenciaBodySchema,
) {}

const ReprovarDivergenciaParamSchema = z.object({
  id: z.uuid(),
  divId: z.uuid(),
});

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ReprovarDivergenciaInventarioController {
  constructor(
    private readonly reprovarDivergenciaInventarioUseCase: ReprovarDivergenciaInventarioUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'inventario_divergencia' })
  @Patch(':id/divergencias/:divId/reprovar')
  @ApiOperation({
    summary: 'Reject inventario divergencia',
    operationId: 'reprovarDivergenciaInventario',
  })
  @ApiSuccessResponse(DivergenciaInventarioResponseDto)
  async handle(
    @Param() params: { id: string; divId: string },
    @Body() body: ReprovarDivergenciaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const { id, divId } = ReprovarDivergenciaParamSchema.parse(params);
    const updated = await this.reprovarDivergenciaInventarioUseCase.execute(
      id,
      divId,
      getRequestUser(request)?.id ?? null,
      body.motivoReprovacao,
    );

    return toDivergenciaInventarioPersistidaResponse(updated);
  }
}
