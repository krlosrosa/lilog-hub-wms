import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  ListDivergenciasInventarioResponseDto,
  toDivergenciaInventarioPersistidaResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { ListDivergenciasInventarioUseCase } from '../../../application/usecases/inventario/divergencia.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const InventarioIdParamSchema = z.object({
  id: z.uuid(),
});

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListDivergenciasInventarioController {
  constructor(
    private readonly listDivergenciasInventarioUseCase: ListDivergenciasInventarioUseCase,
  ) {}

  @Get(':id/divergencias')
  @ApiOperation({
    summary: 'List inventario divergencias',
    operationId: 'listDivergenciasInventario',
  })
  @ApiSuccessResponse(ListDivergenciasInventarioResponseDto)
  async handle(@Param() params: { id: string }) {
    const { id } = InventarioIdParamSchema.parse(params);
    const items = await this.listDivergenciasInventarioUseCase.execute(id);

    return {
      items: items.map(toDivergenciaInventarioPersistidaResponse),
    };
  }
}
