import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListRecebimentoAvariasResponseDto } from '../../../application/dtos/recebimento/recebimento-avaria.dto.js';
import { ListRecebimentoAvariasUseCase } from '../../../application/usecases/recebimento/list-recebimento-avarias.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListRecebimentoAvariasController {
  constructor(
    private readonly listRecebimentoAvariasUseCase: ListRecebimentoAvariasUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Get(':id/avarias')
  @ApiOperation({
    summary: 'Listar avarias do recebimento',
    operationId: 'listRecebimentoAvarias',
  })
  @ApiSuccessResponse(ListRecebimentoAvariasResponseDto)
  handle(@Param('id') id: string) {
    return this.listRecebimentoAvariasUseCase.execute(id);
  }
}
