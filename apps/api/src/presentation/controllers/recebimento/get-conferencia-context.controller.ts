import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConferenciaContextResponseDto } from '../../../application/dtos/recebimento/operador-conferencia.dto.js';
import { GetConferenciaContextUseCase } from '../../../application/usecases/recebimento/get-conferencia-context.usecase.js';
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
export class GetConferenciaContextController {
  constructor(
    private readonly getConferenciaContextUseCase: GetConferenciaContextUseCase,
  ) {}

  @RequirePermissions(
    RECEBIMENTO_PERMISSION.VISUALIZAR,
    RECEBIMENTO_PERMISSION.CONFERIR,
  )
  @Get(':id/conferencia')
  @ApiOperation({
    summary: 'Get blind conference context for operator',
    operationId: 'getConferenciaContext',
  })
  @ApiSuccessResponse(ConferenciaContextResponseDto)
  handle(@Param('id') id: string) {
    return this.getConferenciaContextUseCase.execute(id);
  }
}
