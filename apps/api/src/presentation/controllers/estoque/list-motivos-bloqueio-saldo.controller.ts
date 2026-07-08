import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListMotivosBloqueioSaldoQueryDto,
  ListMotivosBloqueioSaldoResponseDto,
} from '../../../application/dtos/estoque/estoque.dto.js';
import { ListMotivosBloqueioSaldoUseCase } from '../../../application/usecases/estoque/list-motivos-bloqueio-saldo.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Estoque')
@Controller('estoque/motivos-bloqueio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListMotivosBloqueioSaldoController {
  constructor(
    private readonly listMotivosBloqueioSaldoUseCase: ListMotivosBloqueioSaldoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar motivos de bloqueio de saldo',
    operationId: 'listMotivosBloqueioSaldo',
  })
  @ApiSuccessResponse(ListMotivosBloqueioSaldoResponseDto)
  async handle(@Query() query: ListMotivosBloqueioSaldoQueryDto) {
    const items = await this.listMotivosBloqueioSaldoUseCase.execute(query);
    return { items };
  }
}
