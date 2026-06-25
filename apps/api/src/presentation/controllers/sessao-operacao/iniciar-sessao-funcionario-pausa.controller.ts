import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { FastifyRequest } from 'fastify';

import { SessaoFuncionarioPausaDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { IniciarSessaoFuncionarioPausaUseCase } from '../../../application/usecases/sessao-operacao/iniciar-sessao-funcionario-pausa.usecase.js';
import { IniciarSessaoPausaInputSchema } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
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

class IniciarSessaoFuncionarioPausaBodyDto extends createZodDto(
  IniciarSessaoPausaInputSchema,
) {}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class IniciarSessaoFuncionarioPausaController {
  constructor(
    private readonly iniciarSessaoFuncionarioPausaUseCase: IniciarSessaoFuncionarioPausaUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post(':id/funcionarios/:funcionarioId/pausas/iniciar')
  @Auditable({ action: 'create', resource: 'sessao_funcionario_pausa' })
  @ApiOperation({
    summary: 'Iniciar pausa do funcionario na sessao',
    operationId: 'iniciarSessaoFuncionarioPausa',
  })
  @ApiSuccessResponse(SessaoFuncionarioPausaDto, 'created')
  handle(
    @Param('id') id: string,
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Body() body: IniciarSessaoFuncionarioPausaBodyDto,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const userId = getRequestUser(request)?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }
    return this.iniciarSessaoFuncionarioPausaUseCase.execute(
      id,
      funcionarioId,
      userId,
      body,
    );
  }
}
