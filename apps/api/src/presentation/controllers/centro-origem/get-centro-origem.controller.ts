import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CentroOrigemResponseDto } from '../../../application/dtos/centro-origem/centro-origem.dto.js';
import { GetCentroOrigemUseCase } from '../../../application/usecases/centro-origem/get-centro-origem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Centro de Origem')
@Controller('centros-origem')
@ApiErrorResponses()
export class GetCentroOrigemController {
  constructor(
    private readonly getCentroOrigemUseCase: GetCentroOrigemUseCase,
  ) {}

  @Get(':centro')
  @ApiOperation({
    summary: 'Get centro de origem by code',
    operationId: 'getCentroOrigem',
  })
  @ApiSuccessResponse(CentroOrigemResponseDto)
  handle(@Param('centro') centro: string) {
    return this.getCentroOrigemUseCase.execute(centro);
  }
}
