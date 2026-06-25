import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListUnidadesQueryDto,
  ListUnidadesResponseDto,
} from '../../../application/dtos/unidade/list-unidades.dto.js';
import { ListUnidadesUseCase } from '../../../application/usecases/unidade/list-unidades.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
@ApiTags('Unidade')
@Controller('unidades')
@ApiErrorResponses()
export class ListUnidadesController {
  constructor(private readonly listUnidadesUseCase: ListUnidadesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List unidades',
    operationId: 'listUnidades',
  })
  @ApiSuccessResponse(ListUnidadesResponseDto)
  handle(@Query() query: ListUnidadesQueryDto) {
    return this.listUnidadesUseCase.execute(query);
  }
}
