import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PreRecebimentoDetalheResponseDto } from '../../../application/dtos/recebimento/pre-recebimento-detalhe.dto.js';
import { GetPreRecebimentoDetalheUseCase } from '../../../application/usecases/recebimento/get-pre-recebimento-detalhe.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetPreRecebimentoDetalheController {
  constructor(
    private readonly getPreRecebimentoDetalheUseCase: GetPreRecebimentoDetalheUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Get(':id/detalhe')
  @ApiOperation({
    summary: 'Get pre-recebimento detail read model (view)',
    operationId: 'getPreRecebimentoDetalhe',
  })
  @ApiSuccessResponse(PreRecebimentoDetalheResponseDto)
  handle(@Param('id') id: string) {
    return this.getPreRecebimentoDetalheUseCase.execute(id);
  }
}
