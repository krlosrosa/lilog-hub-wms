import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SessaoDetailDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { GetSessaoUseCase } from '../../../application/usecases/sessao-operacao/get-sessao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetSessaoController {
  constructor(private readonly getSessaoUseCase: GetSessaoUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Get sessao de trabalho', operationId: 'getSessao' })
  @ApiSuccessResponse(SessaoDetailDto)
  handle(@Param('id') id: string) {
    return this.getSessaoUseCase.execute(id);
  }
}
