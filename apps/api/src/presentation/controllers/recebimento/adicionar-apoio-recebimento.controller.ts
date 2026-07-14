import { Body, Controller, Delete, Param, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AlocacaoRecebimentoDto } from '../../../application/dtos/recebimento/recursos-recebimento-sessao.dto.js';
import { AdicionarApoioRecebimentoUseCase } from '../../../application/usecases/recebimento/adicionar-apoio-recebimento.usecase.js';
import { EncerrarApoioRecebimentoUseCase } from '../../../application/usecases/recebimento/encerrar-apoio-recebimento.usecase.js';
import { RemoverApoioRecebimentoUseCase } from '../../../application/usecases/recebimento/remover-apoio-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AdicionarApoioRecebimentoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  preRecebimentoId: z.uuid(),
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
});

class AdicionarApoioRecebimentoBodyDto extends createZodDto(
  AdicionarApoioRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos/alocacoes/apoios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AdicionarApoioRecebimentoController {
  constructor(
    private readonly adicionarApoioRecebimentoUseCase: AdicionarApoioRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'recebimento_apoio' })
  @Post()
  @ApiOperation({
    summary: 'Adicionar conferente de apoio a uma demanda de recebimento',
    operationId: 'adicionarApoioRecebimento',
  })
  @ApiSuccessResponse(AlocacaoRecebimentoDto, 'created')
  handle(
    @Body() body: AdicionarApoioRecebimentoBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.adicionarApoioRecebimentoUseCase.execute({
      preRecebimentoId: body.preRecebimentoId,
      sessaoId: body.sessaoId,
      sessaoFuncionarioId: body.sessaoFuncionarioId,
      unidadeId: body.unidadeId,
      userId: req.user?.id ?? null,
    });
  }
}

const RemoverApoioParamsSchema = z.object({
  id: z.uuid(),
});

class RemoverApoioParamsDto extends createZodDto(RemoverApoioParamsSchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos/alocacoes/apoios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverApoioRecebimentoController {
  constructor(
    private readonly removerApoioRecebimentoUseCase: RemoverApoioRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'delete', resource: 'recebimento_apoio' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover conferente de apoio de uma demanda de recebimento',
    operationId: 'removerApoioRecebimento',
  })
  @ApiSuccessResponse(AlocacaoRecebimentoDto, 'ok')
  handle(@Param() params: RemoverApoioParamsDto) {
    return this.removerApoioRecebimentoUseCase.execute(params.id);
  }
}

@ApiTags('Recebimento')
@Controller('recebimentos/alocacoes/apoios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class EncerrarApoioRecebimentoController {
  constructor(
    private readonly encerrarApoioRecebimentoUseCase: EncerrarApoioRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'update', resource: 'recebimento_apoio' })
  @Post(':id/encerrar')
  @ApiOperation({
    summary: 'Encerrar participação de apoio em uma demanda de recebimento',
    operationId: 'encerrarApoioRecebimento',
  })
  @ApiSuccessResponse(AlocacaoRecebimentoDto, 'ok')
  handle(
    @Param() params: RemoverApoioParamsDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.encerrarApoioRecebimentoUseCase.execute(
      params.id,
      req.user.id,
    );
  }
}
