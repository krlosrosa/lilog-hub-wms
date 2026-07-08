import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListRegrasEnderecamentoQueryDto } from '../../../application/dtos/armazenagem/regra-enderecamento.dto.js';
import { ListRegrasEnderecamentoResponseDto } from '../../../application/dtos/armazenagem/regra-enderecamento.dto.js';
import { ListRegrasEnderecamentoUseCase } from '../../../application/usecases/armazenagem/list-regras-enderecamento.usecase.js';
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
export class ListRegrasEnderecamentoController {
  constructor(
    private readonly listRegrasEnderecamentoUseCase: ListRegrasEnderecamentoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List storage addressing rules',
    operationId: 'listRegrasEnderecamento',
  })
  @ApiSuccessResponse(ListRegrasEnderecamentoResponseDto)
  handle(@Query() query: ListRegrasEnderecamentoQueryDto) {
    return this.listRegrasEnderecamentoUseCase.execute(query);
  }
}
