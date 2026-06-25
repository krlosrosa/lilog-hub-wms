import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaContagemResponseDto,
  toDemandaContagemResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { ListDemandasContagemUseCase } from '../../../application/usecases/inventario/demanda.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

const InventarioIdParamSchema = z.object({
  inventarioId: z.uuid(),
});

class InventarioIdParamDto extends createZodDto(InventarioIdParamSchema) {}

@ApiTags('Inventario')
@Controller('inventarios/:inventarioId/demandas')
@ApiErrorResponses()
export class ListDemandasController {
  constructor(
    private readonly listDemandasContagemUseCase: ListDemandasContagemUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List demandas de contagem',
    operationId: 'listDemandasContagem',
  })
  @ApiSuccessResponse(DemandaContagemResponseDto)
  async handle(@Param() params: InventarioIdParamDto) {
    const items = await this.listDemandasContagemUseCase.execute(
      params.inventarioId,
    );
    return items.map(toDemandaContagemResponse);
  }
}
