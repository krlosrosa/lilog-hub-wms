import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { FastifyRequest } from 'fastify';

import {
  ListFuncionariosApoioCandidatosResponseDto,
  SessaoFuncionarioDto,
} from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { AdicionarFuncionarioApoioUseCase } from '../../../application/usecases/sessao-operacao/adicionar-funcionario-apoio.usecase.js';
import { EncerrarFuncionarioApoioUseCase } from '../../../application/usecases/sessao-operacao/encerrar-funcionario-apoio.usecase.js';
import { ListFuncionariosApoioCandidatosUseCase } from '../../../application/usecases/sessao-operacao/list-funcionarios-apoio-candidatos.usecase.js';
import { AdicionarFuncionarioApoioInputSchema } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
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

class AdicionarFuncionarioApoioBodyDto extends createZodDto(
  AdicionarFuncionarioApoioInputSchema,
) {}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AdicionarFuncionarioApoioController {
  constructor(
    private readonly adicionarFuncionarioApoioUseCase: AdicionarFuncionarioApoioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post(':id/apoios')
  @Auditable({ action: 'create', resource: 'sessao_funcionario_apoio' })
  @ApiOperation({
    summary: 'Adicionar funcionario de apoio na sessao',
    operationId: 'adicionarFuncionarioApoio',
  })
  @ApiSuccessResponse(SessaoFuncionarioDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: AdicionarFuncionarioApoioBodyDto,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const userId = getRequestUser(request)?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    return this.adicionarFuncionarioApoioUseCase.execute(id, body, userId);
  }
}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class EncerrarFuncionarioApoioController {
  constructor(
    private readonly encerrarFuncionarioApoioUseCase: EncerrarFuncionarioApoioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Delete(':id/apoios/:sessaoFuncionarioId')
  @Auditable({ action: 'close', resource: 'sessao_funcionario_apoio' })
  @ApiOperation({
    summary: 'Encerrar apoio do funcionario na sessao',
    operationId: 'encerrarFuncionarioApoio',
  })
  @ApiSuccessResponse(SessaoFuncionarioDto)
  handle(
    @Param('id') id: string,
    @Param('sessaoFuncionarioId') sessaoFuncionarioId: string,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    const userId = getRequestUser(request)?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    return this.encerrarFuncionarioApoioUseCase.execute(
      id,
      sessaoFuncionarioId,
      userId,
    );
  }
}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListFuncionariosApoioCandidatosController {
  constructor(
    private readonly listFuncionariosApoioCandidatosUseCase: ListFuncionariosApoioCandidatosUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':id/apoios/candidatos')
  @ApiOperation({
    summary: 'Listar candidatos a apoio para a sessao',
    operationId: 'listFuncionariosApoioCandidatos',
  })
  @ApiSuccessResponse(ListFuncionariosApoioCandidatosResponseDto)
  handle(@Param('id') id: string) {
    return this.listFuncionariosApoioCandidatosUseCase.execute(id);
  }
}
