import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AlocacaoRecebimentoDto } from '../../../application/dtos/recebimento/recursos-recebimento-sessao.dto.js';
import { CriarAlocacaoRecebimentoUseCase } from '../../../application/usecases/recebimento/criar-alocacao-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarAlocacaoRecebimentoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  preRecebimentoId: z.uuid(),
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
});

class CriarAlocacaoRecebimentoBodyDto extends createZodDto(
  CriarAlocacaoRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos/alocacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarAlocacaoRecebimentoController {
  constructor(
    private readonly criarAlocacaoRecebimentoUseCase: CriarAlocacaoRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'recebimento_alocacao' })
  @Post()
  @ApiOperation({
    summary: 'Atribuir conferente a um pré-recebimento',
    operationId: 'criarAlocacaoRecebimento',
  })
  @ApiSuccessResponse(AlocacaoRecebimentoDto, 'created')
  handle(
    @Body() body: CriarAlocacaoRecebimentoBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.criarAlocacaoRecebimentoUseCase.execute({
      preRecebimentoId: body.preRecebimentoId,
      sessaoId: body.sessaoId,
      sessaoFuncionarioId: body.sessaoFuncionarioId,
      unidadeId: body.unidadeId,
      userId: req.user?.id ?? null,
    });
  }
}
