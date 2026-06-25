import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UnidadeResponseDto } from '../../../application/dtos/unidade/list-unidades.dto.js';
import { GetUnidadeUseCase } from '../../../application/usecases/unidade/get-unidade.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
@ApiTags('Unidade')
@Controller('unidades')
@ApiErrorResponses()
export class GetUnidadeController {
  constructor(private readonly getUnidadeUseCase: GetUnidadeUseCase) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get unidade by id',
    operationId: 'getUnidade',
  })
  @ApiSuccessResponse(UnidadeResponseDto)
  handle(@Param('id') id: string) {
    return this.getUnidadeUseCase.execute(id);
  }
}
