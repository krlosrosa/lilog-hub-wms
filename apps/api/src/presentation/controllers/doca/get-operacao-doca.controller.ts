import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { OperacaoDocaResponseDto } from '../../../application/dtos/doca/operacao-doca.dto.js';
import { GetOperacaoDocaUseCase } from '../../../application/usecases/operacao-doca/get-operacao-doca.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Doca')
@Controller('docas/operacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetOperacaoDocaController {
  constructor(private readonly getOperacaoDocaUseCase: GetOperacaoDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.OPERACAO_VIEW)
  @Get(':id')
  @ApiOperation({
    summary: 'Get operacao doca by id',
    operationId: 'getOperacaoDoca',
  })
  @ApiSuccessResponse(OperacaoDocaResponseDto)
  handle(@Param('id') id: string) {
    return this.getOperacaoDocaUseCase.execute(id);
  }
}
