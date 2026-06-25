import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetInventarioTrendUseCase } from '../../../application/usecases/inventario/inventario.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Inventario')
@Controller('inventarios')
@ApiErrorResponses()
export class GetInventarioTrendController {
  constructor(
    private readonly getInventarioTrendUseCase: GetInventarioTrendUseCase,
  ) {}

  @Get('trend')
  @ApiOperation({
    summary: 'Get inventario trend',
    operationId: 'getInventarioTrend',
  })
  @ApiSuccessResponse(Object)
  async handle() {
    return this.getInventarioTrendUseCase.execute();
  }
}
