import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { RegraProcessoResponseDto } from '../../../application/dtos/regra-processo/regra-processo.dto.js';
import { FindRegraProcessoUseCase } from '../../../application/usecases/regra-processo/find-regra-processo.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Regras de Processo')
@Controller('regras-processo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class FindRegraProcessoController {
  constructor(
    private readonly findRegraProcessoUseCase: FindRegraProcessoUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Find process rule by id',
    operationId: 'findRegraProcesso',
  })
  @ApiSuccessResponse(RegraProcessoResponseDto, 'ok')
  handle(@Param('id') id: string) {
    return this.findRegraProcessoUseCase.execute(id);
  }
}
