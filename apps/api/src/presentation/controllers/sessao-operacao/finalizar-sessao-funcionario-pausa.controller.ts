import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { SessaoFuncionarioPausaDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { FinalizarSessaoFuncionarioPausaUseCase } from '../../../application/usecases/sessao-operacao/finalizar-sessao-funcionario-pausa.usecase.js';
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
export class FinalizarSessaoFuncionarioPausaController {
  constructor(
    private readonly finalizarSessaoFuncionarioPausaUseCase: FinalizarSessaoFuncionarioPausaUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Patch(':id/funcionarios/:funcionarioId/pausas/finalizar')
  @Auditable({ action: 'close', resource: 'sessao_funcionario_pausa' })
  @ApiOperation({
    summary: 'Finalizar pausa em andamento do funcionario na sessao',
    operationId: 'finalizarSessaoFuncionarioPausa',
  })
  @ApiSuccessResponse(SessaoFuncionarioPausaDto)
  handle(
    @Param('id') id: string,
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const userId = getRequestUser(request)?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    return this.finalizarSessaoFuncionarioPausaUseCase.execute(
      id,
      funcionarioId,
      userId,
    );
  }
}
