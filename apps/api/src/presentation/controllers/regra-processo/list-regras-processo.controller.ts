import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListRegrasProcessoQueryDto,
  ListRegrasProcessoResponseDto,
} from '../../../application/dtos/regra-processo/regra-processo.dto.js';
import { ListRegrasProcessoUseCase } from '../../../application/usecases/regra-processo/list-regras-processo.usecase.js';
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
export class ListRegrasProcessoController {
  constructor(
    private readonly listRegrasProcessoUseCase: ListRegrasProcessoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List process rules',
    operationId: 'listRegrasProcesso',
  })
  @ApiSuccessResponse(ListRegrasProcessoResponseDto, 'ok')
  handle(@Query() query: ListRegrasProcessoQueryDto) {
    return this.listRegrasProcessoUseCase.execute(query);
  }
}
