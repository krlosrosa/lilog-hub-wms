import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListCentrosOrigemQueryDto,
  ListCentrosOrigemResponseDto,
} from '../../../application/dtos/centro-origem/centro-origem.dto.js';
import { ListCentrosOrigemUseCase } from '../../../application/usecases/centro-origem/list-centros-origem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Centro de Origem')
@Controller('centros-origem')
@ApiErrorResponses()
export class ListCentrosOrigemController {
  constructor(
    private readonly listCentrosOrigemUseCase: ListCentrosOrigemUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List centros de origem',
    operationId: 'listCentrosOrigem',
  })
  @ApiSuccessResponse(ListCentrosOrigemResponseDto)
  handle(@Query() query: ListCentrosOrigemQueryDto) {
    return this.listCentrosOrigemUseCase.execute(query);
  }
}
