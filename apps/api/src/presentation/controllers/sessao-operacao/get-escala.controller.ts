import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { EscalaDetailDto } from '../../../application/dtos/sessao-operacao/escala.dto.js';
import { GetEscalaUseCase } from '../../../application/usecases/sessao-operacao/get-escala.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/escalas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetEscalaController {
  constructor(private readonly getEscalaUseCase: GetEscalaUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Get escala by id', operationId: 'getEscala' })
  @ApiSuccessResponse(EscalaDetailDto)
  handle(@Param('id') id: string) {
    return this.getEscalaUseCase.execute(id);
  }
}
