import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  InventarioKpiResponseDto,
  ListInventariosQueryDto,
  ListInventariosResponseDto,
  toInventarioResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import {
  GetInventarioKpiUseCase,
  ListInventariosUseCase,
} from '../../../application/usecases/inventario/inventario.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Inventario')
@Controller('inventarios')
@ApiErrorResponses()
export class ListInventariosController {
  constructor(
    private readonly listInventariosUseCase: ListInventariosUseCase,
    private readonly getInventarioKpiUseCase: GetInventarioKpiUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List inventarios',
    operationId: 'listInventarios',
  })
  @ApiSuccessResponse(ListInventariosResponseDto)
  async handle(@Query() query: ListInventariosQueryDto) {
    const result = await this.listInventariosUseCase.execute(query);
    return {
      ...result,
      items: result.items.map(toInventarioResponse),
    };
  }

  @Get('kpi')
  @ApiOperation({
    summary: 'Get inventario KPI',
    operationId: 'getInventarioKpi',
  })
  @ApiSuccessResponse(InventarioKpiResponseDto)
  getKpi() {
    return this.getInventarioKpiUseCase.execute();
  }
}
