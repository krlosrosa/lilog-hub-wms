import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import {
  InventarioDetalheResponseDto,
  toInventarioResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { GetInventarioDetalheUseCase } from '../../../application/usecases/inventario/inventario.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

const InventarioIdParamSchema = z.object({
  id: z.uuid(),
});

@ApiTags('Inventario')
@Controller('inventarios')
@ApiErrorResponses()
export class GetInventarioController {
  constructor(
    private readonly getInventarioDetalheUseCase: GetInventarioDetalheUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get inventario detail',
    operationId: 'getInventario',
  })
  @ApiSuccessResponse(InventarioDetalheResponseDto)
  async handle(@Param() params: { id: string }) {
    const { id } = InventarioIdParamSchema.parse(params);
    const detalhe = await this.getInventarioDetalheUseCase.execute(id);
    const base = toInventarioResponse(detalhe);

    return {
      ...base,
      progressoPercent: detalhe.progressoPercent,
      itensContados: detalhe.itensContados,
      itensTotal: detalhe.itensTotal,
      acuraciaPercent: detalhe.acuraciaPercent,
      divergenciasCount: detalhe.divergenciasCount,
      startedAt: base.startedAt ?? null,
      setoresProgresso: detalhe.setoresProgresso,
    };
  }
}
