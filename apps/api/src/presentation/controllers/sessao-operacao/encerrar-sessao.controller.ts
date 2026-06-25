import { Controller, Param, Patch, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { SessaoDetailDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { EncerrarSessaoUseCase } from '../../../application/usecases/sessao-operacao/encerrar-sessao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class EncerrarSessaoController {
  constructor(private readonly encerrarSessaoUseCase: EncerrarSessaoUseCase) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Patch(':id/encerrar')
  @Auditable({ action: 'close', resource: 'sessao_trabalho' })
  @ApiOperation({
    summary: 'Encerrar sessao de trabalho',
    operationId: 'encerrarSessao',
  })
  @ApiSuccessResponse(SessaoDetailDto)
  handle(
    @Param('id') id: string,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const userId = getRequestUser(request)?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    return this.encerrarSessaoUseCase.execute(id, userId);
  }
}
