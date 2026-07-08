import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RegraEnderecamentoResponseDto } from '../../../application/dtos/armazenagem/regra-enderecamento.dto.js';
import { GetRegraEnderecamentoUseCase } from '../../../application/usecases/armazenagem/get-regra-enderecamento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Armazenagem')
@Controller('armazenagem/regras-enderecamento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRegraEnderecamentoController {
  constructor(
    private readonly getRegraEnderecamentoUseCase: GetRegraEnderecamentoUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get storage addressing rule by id',
    operationId: 'getRegraEnderecamento',
  })
  @ApiSuccessResponse(RegraEnderecamentoResponseDto)
  handle(@Param('id') id: string) {
    return this.getRegraEnderecamentoUseCase.execute(id);
  }
}
