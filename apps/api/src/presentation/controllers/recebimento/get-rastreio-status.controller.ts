import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RastreioStatusResponseDto } from '../../../application/dtos/recebimento/rastreio-status.dto.js';
import { GetRastreioStatusUseCase } from '../../../application/usecases/recebimento/gerar-link-rastreio.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';

@ApiTags('Rastreio')
@Controller('rastreio')
@ApiErrorResponses()
export class GetRastreioStatusController {
  constructor(
    private readonly getRastreioStatusUseCase: GetRastreioStatusUseCase,
  ) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Get driver tracking status by token',
    operationId: 'getRastreioStatus',
  })
  @ApiSuccessResponse(RastreioStatusResponseDto)
  handle(@Param('token') token: string) {
    return this.getRastreioStatusUseCase.execute(token);
  }
}
